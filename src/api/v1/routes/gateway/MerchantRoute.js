// routes/merchantRoutes.js
const express = require("express");
const router = express.Router();
const { Merchant, Transaction } = require("../../database/models");
const {
  merchantRegistrationValidator,
  webhookConfigValidator,
} = require("../../validators/gateway/GatewayValidator");
const {
  authenticateMerchant,
  rateLimiter,
  auditLog,
} = require("../../middlewares/gateway/auth");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Apply rate limiting and audit logging to all routes
router.use(rateLimiter(100, 60000));
router.use(auditLog);

/**
 * @route   POST /api/merchants/register
 * @desc    Register a new merchant
 * @access  Public
 */
router.post("/register", merchantRegistrationValidator, async (req, res) => {
  try {
    const { businessName, email, walletAddress, phone, country } = req.body;

    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({
      where: { email },
    });

    if (existingMerchant) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Check wallet address
    const existingWallet = await Merchant.findOne({
      where: { wallet_address: walletAddress },
    });

    if (existingWallet) {
      return res.status(409).json({
        success: false,
        error: "Wallet address already registered",
      });
    }

    // Generate API keys
    const apiKey = "pk_live_" + crypto.randomBytes(32).toString("hex");
    const apiSecret = "sk_live_" + crypto.randomBytes(32).toString("hex");
    const apiSecretHash = await bcrypt.hash(apiSecret, 10);

    // Generate webhook secret
    const webhookSecret = "whsec_" + crypto.randomBytes(32).toString("hex");

    // Create merchant
    const merchant = await Merchant.create({
      business_name: businessName,
      email,
      wallet_address: walletAddress,
      phone,
      country,
      api_key: apiKey,
      api_secret_hash: apiSecretHash,
      webhook_secret: webhookSecret,
      status: "pending_verification",
    });

    res.status(201).json({
      success: true,
      message: "Merchant registered successfully",
      data: {
        merchantId: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        walletAddress: merchant.wallet_address,
        apiKey: apiKey,
        apiSecret: apiSecret, // Only shown once!
        webhookSecret: webhookSecret,
        status: merchant.status,
      },
    });
  } catch (error) {
    console.error("Merchant registration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register merchant",
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/merchants/profile
 * @desc    Get merchant profile
 * @access  Private
 */
router.get("/profile", authenticateMerchant, async (req, res) => {
  try {
    const merchant = req.merchant;

    res.json({
      success: true,
      data: {
        id: merchant.id,
        businessName: merchant.business_name,
        email: merchant.email,
        walletAddress: merchant.wallet_address,
        phone: merchant.phone,
        country: merchant.country,
        status: merchant.status,
        kycVerified: merchant.kyc_verified,
        totalVolume: merchant.total_volume,
        availableBalance: merchant.available_balance,
        pendingBalance: merchant.pending_balance,
        webhookUrl: merchant.webhook_url,
        settings: merchant.settings,
        createdAt: merchant.created_at,
        lastLoginAt: merchant.last_login_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
});

/**
 * @route   PUT /api/merchants/profile
 * @desc    Update merchant profile
 * @access  Private
 */
router.put("/profile", authenticateMerchant, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { businessName, phone, country, settings } = req.body;

    const updateData = {};
    if (businessName) updateData.business_name = businessName;
    if (phone) updateData.phone = phone;
    if (country) updateData.country = country;
    if (settings) updateData.settings = { ...merchant.settings, ...settings };

    await merchant.update(updateData);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: merchant.toJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
});

/**
 * @route   GET /api/merchants/balance
 * @desc    Get merchant balance
 * @access  Private
 */
router.get("/balance", authenticateMerchant, async (req, res) => {
  try {
    const merchant = req.merchant;

    res.json({
      success: true,
      data: {
        availableBalance: parseFloat(merchant.available_balance),
        pendingBalance: parseFloat(merchant.pending_balance),
        totalVolume: parseFloat(merchant.total_volume),
        currency: "ETH",
      },
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch balance",
    });
  }
});

/**
 * @route   POST /api/merchants/regenerate-keys
 * @desc    Regenerate API keys
 * @access  Private
 */
router.post("/regenerate-keys", authenticateMerchant, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { apiKey, apiSecret } = await merchant.regenerateApiKeys();

    res.json({
      success: true,
      message: "API keys regenerated successfully",
      data: {
        apiKey,
        apiSecret, // Only shown once!
        warning: "Store these securely. They will not be shown again.",
      },
    });
  } catch (error) {
    console.error("Regenerate keys error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to regenerate API keys",
    });
  }
});

/**
 * @route   POST /api/merchants/webhook
 * @desc    Configure webhook settings
 * @access  Private
 */
router.post(
  "/webhook",
  authenticateMerchant,
  webhookConfigValidator,
  async (req, res) => {
    try {
      const merchant = req.merchant;
      const { url, events } = req.body;

      await merchant.update({
        webhook_url: url,
        settings: {
          ...merchant.settings,
          webhook_events: events || [
            "payment.completed",
            "payment.failed",
            "payment.refunded",
          ],
        },
      });

      res.json({
        success: true,
        message: "Webhook configured successfully",
        data: {
          webhookUrl: url,
          webhookSecret: merchant.webhook_secret,
          events: merchant.settings.webhook_events,
        },
      });
    } catch (error) {
      console.error("Configure webhook error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to configure webhook",
      });
    }
  }
);

/**
 * @route   GET /api/merchants/dashboard
 * @desc    Get merchant dashboard statistics
 * @access  Private
 */
router.get("/dashboard", authenticateMerchant, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { Op } = require("sequelize");

    // Get statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats, weekStats, monthStats, totalStats] = await Promise.all([
      // Today's transactions
      Transaction.findAll({
        where: {
          merchant_id: merchant.id,
          created_at: { [Op.gte]: today },
          status: "completed",
        },
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        ],
        raw: true,
      }),
      // This week
      Transaction.findAll({
        where: {
          merchant_id: merchant.id,
          created_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          status: "completed",
        },
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        ],
        raw: true,
      }),
      // This month
      Transaction.findAll({
        where: {
          merchant_id: merchant.id,
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          status: "completed",
        },
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        ],
        raw: true,
      }),
      // All time
      Transaction.findAll({
        where: {
          merchant_id: merchant.id,
          status: "completed",
        },
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        ],
        raw: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        balance: {
          available: parseFloat(merchant.available_balance),
          pending: parseFloat(merchant.pending_balance),
        },
        today: {
          transactions: parseInt(todayStats[0]?.count || 0),
          volume: parseFloat(todayStats[0]?.total || 0),
        },
        week: {
          transactions: parseInt(weekStats[0]?.count || 0),
          volume: parseFloat(weekStats[0]?.total || 0),
        },
        month: {
          transactions: parseInt(monthStats[0]?.count || 0),
          volume: parseFloat(monthStats[0]?.total || 0),
        },
        allTime: {
          transactions: parseInt(totalStats[0]?.count || 0),
          volume: parseFloat(totalStats[0]?.total || 0),
        },
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data",
    });
  }
});

module.exports = router;
