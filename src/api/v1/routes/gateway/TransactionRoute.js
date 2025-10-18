// routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const {
  Transaction,
  PaymentSession,
  Merchant,
} = require("../../database/models");
const {
  authenticateMerchant,
  rateLimiter,
  auditLog,
} = require("../../middlewares/gateway/auth");
const {
  transactionQueryValidator,
  refundValidator,
  uuidParamValidator,
} = require("../../validators/gateway/GatewayValidator");
const { Op } = require("sequelize");

router.use(authenticateMerchant);
router.use(rateLimiter(100, 60000));
router.use(auditLog);

/**
 * @route   GET /api/transactions
 * @desc    Get merchant transactions with filters
 * @access  Private
 */
router.get("/", transactionQueryValidator, async (req, res) => {
  try {
    const merchant = req.merchant;
    const {
      page = 1,
      limit = 20,
      status,
      type,
      startDate,
      endDate,
      sort = "-created_at",
      search,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = { merchant_id: merchant.id };

    if (status) where.status = status;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    if (search) {
      where[Op.or] = [
        { order_id: { [Op.iLike]: `%${search}%` } },
        { tx_hash: { [Op.iLike]: `%${search}%` } },
        { customer_wallet: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Build order clause
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;
    const sortDirection = sort.startsWith("-") ? "DESC" : "ASC";

    // Get transactions with pagination
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortField, sortDirection]],
      include: [
        {
          model: PaymentSession,
          as: "session",
          attributes: ["session_id", "order_id", "metadata"],
        },
      ],
    });

    res.json({
      success: true,
      data: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: parseFloat(tx.amount),
        currency: tx.currency,
        platformFee: parseFloat(tx.platform_fee),
        netAmount: parseFloat(tx.net_amount),
        customerWallet: tx.customer_wallet,
        txHash: tx.tx_hash,
        blockNumber: tx.block_number,
        orderId: tx.order_id,
        network: tx.network,
        createdAt: tx.created_at,
        session: tx.session
          ? {
              sessionId: tx.session.session_id,
              orderId: tx.session.order_id,
              metadata: tx.session.metadata,
            }
          : null,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
    });
  }
});

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction details
 * @access  Private
 */
router.get("/:id", uuidParamValidator("id"), async (req, res) => {
  try {
    const merchant = req.merchant;
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: {
        id,
        merchant_id: merchant.id,
      },
      include: [
        {
          model: PaymentSession,
          as: "session",
          attributes: [
            "session_id",
            "order_id",
            "metadata",
            "success_url",
            "cancel_url",
          ],
        },
        {
          model: Transaction,
          as: "refundTransaction",
          attributes: ["id", "amount", "status", "created_at"],
        },
        {
          model: Transaction,
          as: "parentTransaction",
          attributes: ["id", "amount", "tx_hash", "created_at"],
        },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: transaction.id,
        type: transaction.type,
        status: transaction.status,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        platformFee: parseFloat(transaction.platform_fee),
        platformFeePercentage: parseFloat(transaction.platform_fee_percentage),
        netAmount: parseFloat(transaction.net_amount),
        customerWallet: transaction.customer_wallet,
        merchantWallet: transaction.merchant_wallet,
        txHash: transaction.tx_hash,
        paymentId: transaction.payment_id,
        blockNumber: transaction.block_number,
        blockTimestamp: transaction.block_timestamp,
        gasUsed: transaction.gas_used,
        gasPrice: transaction.gas_price,
        network: transaction.network,
        orderId: transaction.order_id,
        description: transaction.description,
        metadata: transaction.metadata,
        isRefundable: transaction.isRefundable(),
        refund: transaction.refundTransaction
          ? {
              id: transaction.refundTransaction.id,
              amount: parseFloat(transaction.refundTransaction.amount),
              status: transaction.refundTransaction.status,
              createdAt: transaction.refundTransaction.created_at,
            }
          : null,
        parentTransaction: transaction.parentTransaction
          ? {
              id: transaction.parentTransaction.id,
              amount: parseFloat(transaction.parentTransaction.amount),
              txHash: transaction.parentTransaction.tx_hash,
              createdAt: transaction.parentTransaction.created_at,
            }
          : null,
        session: transaction.session
          ? {
              sessionId: transaction.session.session_id,
              orderId: transaction.session.order_id,
              metadata: transaction.session.metadata,
            }
          : null,
        processedAt: transaction.processed_at,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      },
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transaction",
    });
  }
});

/**
 * @route   POST /api/transactions/refund
 * @desc    Process a refund
 * @access  Private
 */
router.post("/refund", refundValidator, async (req, res) => {
  const t = await Transaction.sequelize.transaction();

  try {
    const merchant = req.merchant;
    const { paymentId, reason } = req.body;

    // Find original transaction
    const originalTx = await Transaction.findOne({
      where: {
        payment_id: paymentId,
        merchant_id: merchant.id,
        type: "payment",
        status: "completed",
      },
      transaction: t,
      lock: true,
    });

    if (!originalTx) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    // Check if already refunded
    if (originalTx.refund_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Transaction already refunded",
      });
    }

    // Check if refundable
    if (!originalTx.isRefundable()) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Transaction is not refundable",
        message: "Refunds are only available within 90 days of payment",
      });
    }

    // Check merchant balance
    const refundAmount = parseFloat(originalTx.net_amount);
    if (parseFloat(merchant.available_balance) < refundAmount) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Insufficient balance",
        message: "Not enough balance to process refund",
        required: refundAmount,
        available: parseFloat(merchant.available_balance),
      });
    }

    // Create refund transaction
    const refundTx = await Transaction.create(
      {
        merchant_id: merchant.id,
        session_id: originalTx.session_id,
        type: "refund",
        status: "completed",
        amount: parseFloat(originalTx.amount),
        currency: originalTx.currency,
        platform_fee: 0, // No fee on refunds
        platform_fee_percentage: 0,
        net_amount: parseFloat(originalTx.amount),
        customer_wallet: originalTx.customer_wallet,
        merchant_wallet: originalTx.merchant_wallet,
        network: originalTx.network,
        order_id: originalTx.order_id,
        description: reason || "Refund",
        parent_transaction_id: originalTx.id,
        metadata: {
          original_tx_hash: originalTx.tx_hash,
          original_payment_id: originalTx.payment_id,
          refund_reason: reason,
        },
        processed_at: new Date(),
      },
      { transaction: t }
    );

    // Update original transaction
    await originalTx.update(
      {
        refund_id: refundTx.id,
      },
      { transaction: t }
    );

    // Update merchant balance
    await merchant.decrement(
      {
        available_balance: refundAmount,
      },
      { transaction: t }
    );

    // Update merchant total volume
    await merchant.decrement(
      {
        total_volume: parseFloat(originalTx.amount),
      },
      { transaction: t }
    );

    await t.commit();

    // Trigger webhook
    triggerWebhook(merchant, "payment.refunded", {
      refundId: refundTx.id,
      originalTransactionId: originalTx.id,
      paymentId: originalTx.payment_id,
      amount: parseFloat(originalTx.amount),
      currency: originalTx.currency,
      customerWallet: originalTx.customer_wallet,
      reason: reason,
    }).catch((err) => console.error("Webhook error:", err));

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: {
        refundId: refundTx.id,
        originalTransactionId: originalTx.id,
        amount: parseFloat(originalTx.amount),
        currency: originalTx.currency,
        status: "completed",
        processedAt: refundTx.processed_at,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Refund error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process refund",
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/transactions/stats/summary
 * @desc    Get transaction statistics
 * @access  Private
 */
router.get("/stats/summary", async (req, res) => {
  try {
    const merchant = req.merchant;
    const { startDate, endDate } = req.query;

    const where = {
      merchant_id: merchant.id,
      status: "completed",
    };

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    // Get statistics by type
    const stats = await Transaction.findAll({
      where,
      attributes: [
        "type",
        [
          Transaction.sequelize.fn("COUNT", Transaction.sequelize.col("id")),
          "count",
        ],
        [
          Transaction.sequelize.fn("SUM", Transaction.sequelize.col("amount")),
          "totalAmount",
        ],
        [
          Transaction.sequelize.fn(
            "SUM",
            Transaction.sequelize.col("platform_fee")
          ),
          "totalFees",
        ],
        [
          Transaction.sequelize.fn(
            "SUM",
            Transaction.sequelize.col("net_amount")
          ),
          "totalNet",
        ],
      ],
      group: ["type"],
      raw: true,
    });

    // Get daily stats for chart
    const dailyStats = await Transaction.findAll({
      where,
      attributes: [
        [
          Transaction.sequelize.fn(
            "DATE",
            Transaction.sequelize.col("created_at")
          ),
          "date",
        ],
        [
          Transaction.sequelize.fn("COUNT", Transaction.sequelize.col("id")),
          "count",
        ],
        [
          Transaction.sequelize.fn("SUM", Transaction.sequelize.col("amount")),
          "volume",
        ],
      ],
      group: [
        Transaction.sequelize.fn(
          "DATE",
          Transaction.sequelize.col("created_at")
        ),
      ],
      order: [
        [
          Transaction.sequelize.fn(
            "DATE",
            Transaction.sequelize.col("created_at")
          ),
          "ASC",
        ],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        summary: stats.reduce((acc, stat) => {
          acc[stat.type] = {
            count: parseInt(stat.count),
            totalAmount: parseFloat(stat.totalAmount || 0),
            totalFees: parseFloat(stat.totalFees || 0),
            totalNet: parseFloat(stat.totalNet || 0),
          };
          return acc;
        }, {}),
        dailyStats: dailyStats.map((stat) => ({
          date: stat.date,
          count: parseInt(stat.count),
          volume: parseFloat(stat.volume || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
});

// Helper function
async function triggerWebhook(merchant, event, data) {
  if (!merchant.webhook_url) return;
  const webhookEvents = merchant.settings?.webhook_events || [];
  if (!webhookEvents.includes(event)) return;

  const { WebhookLog } = require("../../database/models");
  const crypto = require("crypto");

  const payload = {
    event,
    data,
    timestamp: new Date().toISOString(),
    merchantId: merchant.id,
  };
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
      },
      body: JSON.stringify(payload),
      timeout: 10000,
    });

    await WebhookLog.create({
      merchant_id: merchant.id,
      event_type: event,
      url: merchant.webhook_url,
      payload,
      status: response.ok ? "success" : "failed",
      response_code: response.status,
      response_body: (await response.text()).substring(0, 1000),
      sent_at: new Date(),
      duration_ms: Date.now() - startTime,
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
