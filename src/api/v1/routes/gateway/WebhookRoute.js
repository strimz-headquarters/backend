// routes/webhookRoutes.js
const express = require("express");
const router = express.Router();
const { WebhookLog } = require("../../database/models");
const {
  authenticateMerchant,
  rateLimiter,
  auditLog,
} = require("../../middlewares/gateway/auth");
const {
  paginationValidator,
} = require("../../validators/gateway/GatewayValidator");

router.use(authenticateMerchant);
router.use(rateLimiter(50, 60000));
router.use(auditLog);

/**
 * @route   GET /api/webhooks/logs
 * @desc    Get webhook delivery logs
 * @access  Private
 */
router.get("/logs", paginationValidator, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { page = 1, limit = 20, status, eventType } = req.query;
    const offset = (page - 1) * limit;

    const where = { merchant_id: merchant.id };
    if (status) where.status = status;
    if (eventType) where.event_type = eventType;

    const { count, rows: logs } = await WebhookLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        eventType: log.event_type,
        url: log.url,
        status: log.status,
        responseCode: log.response_code,
        retryCount: log.retry_count,
        durationMs: log.duration_ms,
        errorMessage: log.error_message,
        sentAt: log.sent_at,
        nextRetryAt: log.next_retry_at,
        createdAt: log.created_at,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get webhook logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch webhook logs",
    });
  }
});

/**
 * @route   GET /api/webhooks/logs/:id
 * @desc    Get specific webhook log details
 * @access  Private
 */
router.get("/logs/:id", async (req, res) => {
  try {
    const merchant = req.merchant;
    const { id } = req.params;

    const log = await WebhookLog.findOne({
      where: {
        id,
        merchant_id: merchant.id,
      },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Webhook log not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: log.id,
        eventType: log.event_type,
        url: log.url,
        payload: log.payload,
        status: log.status,
        responseCode: log.response_code,
        responseBody: log.response_body,
        errorMessage: log.error_message,
        retryCount: log.retry_count,
        nextRetryAt: log.next_retry_at,
        sentAt: log.sent_at,
        durationMs: log.duration_ms,
        createdAt: log.created_at,
        updatedAt: log.updated_at,
      },
    });
  } catch (error) {
    console.error("Get webhook log error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch webhook log",
    });
  }
});

/**
 * @route   POST /api/webhooks/retry/:id
 * @desc    Manually retry a failed webhook
 * @access  Private
 */
router.post("/retry/:id", async (req, res) => {
  try {
    const merchant = req.merchant;
    const { id } = req.params;

    const log = await WebhookLog.findOne({
      where: {
        id,
        merchant_id: merchant.id,
        status: "failed",
      },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Webhook log not found or not in failed status",
      });
    }

    if (!log.shouldRetry()) {
      return res.status(400).json({
        success: false,
        error: "Maximum retry attempts reached",
      });
    }

    // Retry webhook
    const crypto = require("crypto");
    const timestamp = Date.now();
    const signature = crypto
      .createHmac("sha256", merchant.webhook_secret)
      .update(`${timestamp}.${JSON.stringify(log.payload)}`)
      .digest("hex");

    try {
      const fetch = (await import("node-fetch")).default;
      const startTime = Date.now();

      const response = await fetch(log.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Timestamp": timestamp.toString(),
          "User-Agent": "CryptoPayGateway/1.0",
        },
        body: JSON.stringify(log.payload),
        timeout: 10000,
      });

      const duration = Date.now() - startTime;
      const responseBody = await response.text();

      await log.update({
        status: response.ok ? "success" : "failed",
        response_code: response.status,
        response_body: responseBody.substring(0, 1000),
        retry_count: log.retry_count + 1,
        sent_at: new Date(),
        duration_ms: duration,
        next_retry_at: null,
      });

      res.json({
        success: true,
        message: response.ok
          ? "Webhook delivered successfully"
          : "Webhook delivery failed",
        data: {
          status: response.ok ? "success" : "failed",
          responseCode: response.status,
          retryCount: log.retry_count + 1,
          durationMs: duration,
        },
      });
    } catch (error) {
      await log.update({
        status: "failed",
        error_message: error.message,
        retry_count: log.retry_count + 1,
        next_retry_at: new Date(
          Date.now() + Math.pow(2, log.retry_count) * 60000
        ), // Exponential backoff
      });

      res.status(500).json({
        success: false,
        error: "Failed to deliver webhook",
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Retry webhook error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retry webhook",
    });
  }
});

/**
 * @route   GET /api/webhooks/stats
 * @desc    Get webhook statistics
 * @access  Private
 */
router.get("/stats", async (req, res) => {
  try {
    const merchant = req.merchant;
    const { Op } = require("sequelize");

    const [successCount, failedCount, pendingCount, avgDuration] =
      await Promise.all([
        WebhookLog.count({
          where: {
            merchant_id: merchant.id,
            status: "success",
          },
        }),
        WebhookLog.count({
          where: {
            merchant_id: merchant.id,
            status: "failed",
          },
        }),
        WebhookLog.count({
          where: {
            merchant_id: merchant.id,
            status: "pending",
          },
        }),
        WebhookLog.findOne({
          where: {
            merchant_id: merchant.id,
            status: "success",
            duration_ms: { [Op.ne]: null },
          },
          attributes: [
            [
              WebhookLog.sequelize.fn(
                "AVG",
                WebhookLog.sequelize.col("duration_ms")
              ),
              "avg",
            ],
          ],
          raw: true,
        }),
      ]);

    const total = successCount + failedCount + pendingCount;
    const successRate =
      total > 0 ? ((successCount / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total,
        successful: successCount,
        failed: failedCount,
        pending: pendingCount,
        successRate: parseFloat(successRate),
        avgDurationMs: Math.round(parseFloat(avgDuration?.avg || 0)),
      },
    });
  } catch (error) {
    console.error("Get webhook stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch webhook statistics",
    });
  }
});

/**
 * @route   POST /api/webhooks/test
 * @desc    Send test webhook
 * @access  Private
 */
router.post("/test", async (req, res) => {
  try {
    const merchant = req.merchant;

    if (!merchant.webhook_url) {
      return res.status(400).json({
        success: false,
        error: "Webhook URL not configured",
      });
    }

    const crypto = require("crypto");
    const timestamp = Date.now();

    const testPayload = {
      event: "test.webhook",
      data: {
        message: "This is a test webhook",
        merchantId: merchant.id,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      merchantId: merchant.id,
    };

    const signature = crypto
      .createHmac("sha256", merchant.webhook_secret)
      .update(`${timestamp}.${JSON.stringify(testPayload)}`)
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
        body: JSON.stringify(testPayload),
        timeout: 10000,
      });

      const duration = Date.now() - startTime;
      const responseBody = await response.text();

      // Log test webhook
      await WebhookLog.create({
        merchant_id: merchant.id,
        event_type: "test.webhook",
        url: merchant.webhook_url,
        payload: testPayload,
        status: response.ok ? "success" : "failed",
        response_code: response.status,
        response_body: responseBody.substring(0, 1000),
        sent_at: new Date(),
        duration_ms: duration,
      });

      res.json({
        success: response.ok,
        message: response.ok
          ? "Test webhook delivered successfully"
          : "Test webhook delivery failed",
        data: {
          url: merchant.webhook_url,
          responseCode: response.status,
          durationMs: duration,
          responseBody: responseBody.substring(0, 200),
        },
      });
    } catch (error) {
      // Log failed test webhook
      await WebhookLog.create({
        merchant_id: merchant.id,
        event_type: "test.webhook",
        url: merchant.webhook_url,
        payload: testPayload,
        status: "failed",
        error_message: error.message,
      });

      res.status(500).json({
        success: false,
        error: "Failed to deliver test webhook",
        message: error.message,
      });
    }
  } catch (error) {
    console.error("Test webhook error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send test webhook",
    });
  }
});

module.exports = router;
