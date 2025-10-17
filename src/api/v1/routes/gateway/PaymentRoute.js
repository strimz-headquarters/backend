// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const {
  PaymentSession,
  Transaction,
  Merchant,
} = require("../../database/models");
const {
  createPaymentSessionValidator,
  processPaymentValidator,
} = require("../../validators/gateway/GatewayValidator");
const {
  authenticateMerchant,
  rateLimiter,
  auditLog,
} = require("../../middlewares/gateway/auth");
const { ethers } = require("ethers");
const { Op } = require("sequelize");

router.use(rateLimiter(100, 60000));
router.use(auditLog);

/**
 * @route   POST /api/payments/create
 * @desc    Create a payment session
 * @access  Private
 */
router.post(
  "/create",
  authenticateMerchant,
  createPaymentSessionValidator,
  async (req, res) => {
    const t = await PaymentSession.sequelize.transaction();

    try {
      const merchant = req.merchant;
      const {
        amount,
        orderId,
        currency = "ETH",
        successUrl,
        cancelUrl,
        metadata,
      } = req.body;

      // Check for duplicate order ID
      const existingSession = await PaymentSession.findOne({
        where: {
          merchant_id: merchant.id,
          order_id: orderId,
          status: { [Op.in]: ["pending", "processing", "completed"] },
        },
      });

      if (existingSession) {
        return res.status(409).json({
          success: false,
          error: "Duplicate order ID",
          message: "A payment session with this order ID already exists",
        });
      }

      // Create payment session
      const session = await PaymentSession.create(
        {
          merchant_id: merchant.id,
          order_id: orderId,
          amount: amount,
          currency: currency,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: metadata || {},
          ip_address: req.ip,
          user_agent: req.get("user-agent"),
          network: process.env.NETWORK || "ethereum",
        },
        { transaction: t }
      );

      await t.commit();

      const baseUrl =
        process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.session_id,
          orderId: session.order_id,
          amount: parseFloat(session.amount),
          currency: session.currency,
          status: session.status,
          checkoutUrl: `${baseUrl}/checkout/${session.session_id}`,
          merchantWallet: merchant.wallet_address,
          expiresAt: session.expires_at,
          createdAt: session.created_at,
        },
      });
    } catch (error) {
      await t.rollback();
      console.error("Create payment session error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create payment session",
        message: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/payments/session/:sessionId
 * @desc    Get payment session details
 * @access  Public
 */
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await PaymentSession.findOne({
      where: { session_id: sessionId },
      include: [
        {
          model: Merchant,
          as: "merchant",
          attributes: ["id", "business_name", "wallet_address"],
        },
      ],
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    // Check if expired
    if (session.isExpired() && session.status === "pending") {
      await session.update({ status: "expired" });
    }

    res.json({
      success: true,
      data: {
        sessionId: session.session_id,
        orderId: session.order_id,
        amount: parseFloat(session.amount),
        currency: session.currency,
        status: session.status,
        merchantName: session.merchant.business_name,
        merchantWallet: session.merchant.wallet_address,
        network: session.network,
        expiresAt: session.expires_at,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch session",
    });
  }
});

/**
 * @route   POST /api/payments/process
 * @desc    Process payment (verify transaction)
 * @access  Public
 */
router.post("/process", processPaymentValidator, async (req, res) => {
  const t = await PaymentSession.sequelize.transaction();

  try {
    const { sessionId, txHash } = req.body;

    // Get session
    const session = await PaymentSession.findOne({
      where: { session_id: sessionId },
      include: [
        {
          model: Merchant,
          as: "merchant",
        },
      ],
      transaction: t,
      lock: true,
    });

    if (!session) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    // Validate session status
    if (!session.canProcess()) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Session cannot be processed",
        message: session.isExpired()
          ? "Session expired"
          : `Session status: ${session.status}`,
      });
    }

    // Check if transaction already exists
    const existingTx = await Transaction.findOne({
      where: { tx_hash: txHash },
    });

    if (existingTx) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        error: "Transaction already processed",
      });
    }

    // Update session status
    await session.update({ status: "processing" }, { transaction: t });

    // Initialize provider
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/your-api-key"
    );

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Transaction not found",
        message: "Please wait for the transaction to be mined",
      });
    }

    // Verify transaction was successful
    if (receipt.status !== 1) {
      await session.markFailed("Transaction reverted");
      await t.commit();
      return res.status(400).json({
        success: false,
        error: "Transaction failed",
      });
    }

    // Get transaction details
    const tx = await provider.getTransaction(txHash);

    // Verify amount (converting from Wei)
    const paidAmount = ethers.utils.formatEther(tx.value);
    const expectedAmount = parseFloat(session.amount);

    if (Math.abs(parseFloat(paidAmount) - expectedAmount) > 0.0001) {
      await session.markFailed("Amount mismatch");
      await t.commit();
      return res.status(400).json({
        success: false,
        error: "Payment amount mismatch",
        expected: expectedAmount,
        received: parseFloat(paidAmount),
      });
    }

    // Verify recipient
    if (tx.to.toLowerCase() !== session.merchant.wallet_address.toLowerCase()) {
      await session.markFailed("Invalid recipient");
      await t.commit();
      return res.status(400).json({
        success: false,
        error: "Invalid payment recipient",
      });
    }

    // Calculate platform fee (2.5%)
    const platformFeePercentage = 2.5;
    const platformFee = (expectedAmount * platformFeePercentage) / 100;
    const netAmount = expectedAmount - platformFee;

    // Create transaction record
    const transaction = await Transaction.create(
      {
        merchant_id: session.merchant_id,
        session_id: session.id,
        type: "payment",
        status: "completed",
        amount: expectedAmount,
        currency: session.currency,
        platform_fee: platformFee,
        platform_fee_percentage: platformFeePercentage,
        net_amount: netAmount,
        customer_wallet: tx.from,
        merchant_wallet: session.merchant.wallet_address,
        tx_hash: txHash,
        block_number: receipt.blockNumber,
        block_timestamp: new Date(receipt.blockNumber * 15000), // Approximate
        gas_used: receipt.gasUsed.toString(),
        gas_price: tx.gasPrice.toString(),
        network: session.network,
        order_id: session.order_id,
        metadata: session.metadata,
        processed_at: new Date(),
      },
      { transaction: t }
    );

    // Update session
    await session.markCompleted({
      txHash: txHash,
      paymentId: transaction.payment_id,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    // Update merchant balances
    await session.merchant.increment(
      {
        available_balance: netAmount,
        total_volume: expectedAmount,
      },
      { transaction: t }
    );

    await t.commit();

    // Trigger webhook (async, don't wait)
    triggerWebhook(session.merchant, "payment.completed", {
      sessionId: session.session_id,
      orderId: session.order_id,
      transactionId: transaction.id,
      amount: expectedAmount,
      currency: session.currency,
      txHash: txHash,
      customerWallet: tx.from,
    }).catch((err) => console.error("Webhook error:", err));

    res.json({
      success: true,
      message: "Payment processed successfully",
      data: {
        transactionId: transaction.id,
        sessionId: session.session_id,
        orderId: session.order_id,
        amount: expectedAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        status: "completed",
        txHash: txHash,
        blockNumber: receipt.blockNumber,
        successUrl: session.success_url,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Process payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process payment",
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/payments/cancel/:sessionId
 * @desc    Cancel a payment session
 * @access  Private
 */
router.post("/cancel/:sessionId", authenticateMerchant, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const merchant = req.merchant;

    const session = await PaymentSession.findOne({
      where: {
        session_id: sessionId,
        merchant_id: merchant.id,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    if (session.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "Cannot cancel session",
        message: `Session status: ${session.status}`,
      });
    }

    await session.update({ status: "cancelled" });

    res.json({
      success: true,
      message: "Session cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel session",
    });
  }
});

// Helper function to trigger webhook
async function triggerWebhook(merchant, event, data) {
  if (!merchant.webhook_url) return;

  const webhookEvents = merchant.settings?.webhook_events || [];
  if (!webhookEvents.includes(event)) return;

  const { WebhookLog } = require("../models/associations");
  const crypto = require("crypto");

  const payload = {
    event,
    data,
    timestamp: new Date().toISOString(),
    merchantId: merchant.id,
  };

  // Create signature
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", merchant.webhook_secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest("hex");

  try {
    const fetch = (await import("node-fetch")).default;
    const startTime = Date.now();

    const response = await fetch(merchant.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": timestamp.toString(),
        "User-Agent": "CryptoPayGateway/1.0",
      },
      body: JSON.stringify(payload),
      timeout: 10000,
    });

    const duration = Date.now() - startTime;
    const responseBody = await response.text();

    await WebhookLog.create({
      merchant_id: merchant.id,
      event_type: event,
      url: merchant.webhook_url,
      payload,
      status: response.ok ? "success" : "failed",
      response_code: response.status,
      response_body: responseBody.substring(0, 1000),
      sent_at: new Date(),
      duration_ms: duration,
    });
  } catch (error) {
    await WebhookLog.create({
      merchant_id: merchant.id,
      event_type: event,
      url: merchant.webhook_url,
      payload,
      status: "failed",
      error_message: error.message,
    });
  }
}

module.exports = router;
