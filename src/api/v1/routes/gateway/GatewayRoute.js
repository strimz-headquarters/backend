const router = require("express").Router();
const { PayrollController } = require("../../controllers");
const { pagination, VerifyToken, verifyAdmin } = require("../../middlewares");
const GatewayValidator = require("../../validators/gateway/GatewayValidator");

const { Merchant, User, Subscription } = require("../../database/models");
const {
  estimateGas,
  invokeFunction,
} = require("../../controllers/contract/contract.controller");
const { getTokenAddress } = require("../../helpers/utilities/Utilities");

router.post(
  "/merchants/register",
  GatewayValidator.merchantValidators.register,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: "Name and email required" });
      }

      const merchant = await Merchant.create({
        name,
        email,
        password,
      });

      res.json({
        merchant,
        message: "Merchant registered with generated wallet",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post("/subscriptions", VerifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { price, billingInterval, currency, autoRenew } = req.body;
    const api_key = req.headers["x-api-key"];
    if (!api_key) return res.status(404).json({ error: "Invalid request" });
    const user = await User.findByPk(userId);
    const merchant = await Merchant.findOne({
      where: {
        apiKey: api_key,
      },
    });

    if (!user || !merchant) {
      return res.status(404).json({ error: "User or merchant not found" });
    }

    const durationMonths = billingInterval;
    const totalAmount = price;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const subscription = await Subscription.create({
      userId,
      merchantId: merchant.id,
      amount: price,
      currency: currency,
      startDate,
      endDate,
      nextBillingDate: new Date(
        startDate.setMonth(startDate.getMonth() + billingInterval)
      ),
      autoRenew,
      status: "pending",
    });

    await estimateGas(
      "transfer",
      [merchant.wallet.address, price],
      user.type,
      user.wallet.address,
      user,
      true,
      getTokenAddress(currency)
    );

    const invoke_receipt = await invokeFunction(
      "transfer",
      [merchant.wallet.address, price],
      user.type,
      user.wallet.address,
      user,
      true,
      getTokenAddress(currency)
    );

    await Payment.create({
      subscriptionId: subscription.id,
      userId: user.id,
      merchantId: merchant.id,
      amount: totalAmount,
      currency: currency,
      txHash: invoke_receipt,
      status: "confirmed",
      type: "initial",
    });

    subscription.status = "active";
    await subscription.save();

    return res.json({
      subscription,
      payment: { txHash: invoke_receipt, status: "confirmed" },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/users/:userId/subscriptions", async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { userId: req.params.userId },
      include: [Merchant],
    });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/subscriptions/:id/cancel", VerifyToken, async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (subscription.userId !== req.user.uid) {
      return res.status(401).json({ error: "UNAUTHRIZED" });
    }
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    subscription.status = "cancelled";
    subscription.autoRenew = false;
    await subscription.save();

    res.json({ message: "Subscription cancelled", subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
