// middleware/auth.js
const { Merchant } = require("../../database/models");
const crypto = require("crypto");

/**
 * Authenticate merchant using API key
 */
const authenticateMerchant = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API key required",
        message: "Please provide X-API-Key header",
      });
    }

    // Validate API key format
    if (!apiKey.startsWith("pk_live_") && !apiKey.startsWith("pk_test_")) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key format",
      });
    }

    // Find merchant by API key
    const merchant = await Merchant.findOne({
      where: { api_key: apiKey },
    });

    if (!merchant) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
      });
    }

    // Check merchant status
    if (merchant.status === "suspended") {
      return res.status(403).json({
        success: false,
        error: "Account suspended",
        message: "Your account has been suspended. Please contact support.",
      });
    }

    if (merchant.status === "pending_verification") {
      return res.status(403).json({
        success: false,
        error: "Account pending verification",
        message:
          "Please complete your account verification before using the API.",
      });
    }

    // Update last login
    await merchant.update({ last_login_at: new Date() });

    // Attach merchant to request
    req.merchant = merchant;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    if (!signature || !timestamp) {
      return res.status(401).json({
        success: false,
        error: "Missing webhook signature or timestamp",
      });
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const now = Date.now();
    const requestTime = parseInt(timestamp);

    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return res.status(401).json({
        success: false,
        error: "Request timestamp too old",
      });
    }

    // Get webhook secret from merchant
    const webhookSecret = req.merchant?.webhook_secret;

    if (!webhookSecret) {
      return res.status(400).json({
        success: false,
        error: "Webhook secret not configured",
      });
    }

    // Compute expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    // Compare signatures
    if (signature !== expectedSignature) {
      return res.status(401).json({
        success: false,
        error: "Invalid webhook signature",
      });
    }

    next();
  } catch (error) {
    console.error("Webhook verification error:", error);
    res.status(500).json({
      success: false,
      error: "Webhook verification failed",
    });
  }
};

/**
 * Rate limiting middleware
 */
const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const merchantId = req.merchant?.id;

    if (!merchantId) {
      return next();
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request log for merchant
    if (!requests.has(merchantId)) {
      requests.set(merchantId, []);
    }

    const merchantRequests = requests.get(merchantId);

    // Remove old requests outside the window
    const recentRequests = merchantRequests.filter(
      (time) => time > windowStart
    );
    requests.set(merchantId, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: `Maximum ${maxRequests} requests per minute allowed`,
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
      });
    }

    // Add current request
    recentRequests.push(now);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - recentRequests.length);
    res.setHeader("X-RateLimit-Reset", new Date(now + windowMs).toISOString());

    next();
  };
};

/**
 * Check KYC verification status
 */
const requireKYC = (req, res, next) => {
  if (!req.merchant) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (!req.merchant.kyc_verified) {
    return res.status(403).json({
      success: false,
      error: "KYC verification required",
      message:
        "This action requires KYC verification. Please complete your verification.",
    });
  }

  next();
};

/**
 * Log request for audit trail
 */
const auditLog = async (req, res, next) => {
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;

    // Log to database or logging service
    const logData = {
      merchant_id: req.merchant?.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      user_agent: req.get("user-agent"),
      status_code: res.statusCode,
      duration_ms: duration,
      timestamp: new Date(),
    };

    // In production, save to database
    console.log("Audit Log:", logData);

    return originalJson.call(this, data);
  };

  next();
};

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // In production, check against whitelist
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];

    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Webhook-Signature",
    "X-Webhook-Timestamp",
  ],
};

module.exports = {
  authenticateMerchant,
  verifyWebhookSignature,
  rateLimiter,
  requireKYC,
  auditLog,
  corsOptions,
};
