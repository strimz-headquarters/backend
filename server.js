require("dotenv").config();
const { sequelize, Payroll, User } = require("./src/api/v1/database/models");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const AppRoutes = require("./src/api/v1/routes");
const app = express();
const cron = require("node-cron");

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("common"));
app.use("/api/v1", AppRoutes);

const ErrorHandler = require("./src/api/v1/validations/error/ErrorHandler");
const { Op } = require("sequelize");
const {
  estimateGas,
  invokeFunction,
} = require("./src/api/v1/controllers/contract/contract.controller");
const { ethers } = require("ethers");

async function processPayment(payroll) {
  try {
    console.log(
      {
        payroll: payroll.name,
        hex: ethers.encodeBytes32String(payroll.name.trim().toLowerCase()),
      },
      "\n\n\n\n\n\n\n\n\n\n\n"
    );
    const user = await User.findOne({
      where: {
        id: payroll.owner,
      },
    });
    if (!user) throw new Error("User not found");

    const fund_receipt = await estimateGas(
      "disburse",
      [ethers.encodeBytes32String(payroll.name.trim().toLowerCase())],
      user.type,
      user.wallet.address,
      user
    );
    console.log(`Account funded ${fund_receipt}`);
    const invoke_receipt = await invokeFunction(
      "disburse",
      [ethers.encodeBytes32String(payroll.name.trim().toLowerCase())],
      user.type,
      user
    );

    console.log(`Payroll ${payroll.name} successful. ${invoke_receipt}`);
  } catch (error) {
    console.log(`payroll ${payroll.name} failed`);
    console.log(error);

    throw error;
  }
}

// Function to check if payroll is due
const isPayrollDue = (payroll) => {
  if (payroll.status !== "active") return false;

  const now = new Date();
  const lastPayroll = payroll.last_payroll
    ? new Date(payroll.last_payroll)
    : new Date(payroll.start_date);

  switch (payroll.frequency) {
    case "daily":
      return now - lastPayroll >= 24 * 60 * 60 * 1000; // 1 day
    case "weekly":
      return now - lastPayroll >= 7 * 24 * 60 * 60 * 1000; // 1 week
    case "monthly":
      return (
        now.getMonth() !== lastPayroll.getMonth() ||
        now.getFullYear() !== lastPayroll.getFullYear()
      );
    case "yearly":
      return now.getFullYear() !== lastPayroll.getFullYear();
    default:
      return false;
  }
};

// Function to process due payrolls
const processPayrolls = async () => {
  try {
    console.log("Checking for due payrolls...");

    const payrolls = await Payroll.findAll({
      where: {
        status: "active",
        [Op.or]: [
          { last_payroll: { [Op.is]: null } },
          { last_payroll: { [Op.lte]: new Date() } },
        ],
      },
    });

    const duePayrolls = payrolls.filter(isPayrollDue); // Filter payrolls before processing

    if (duePayrolls.length === 0) {
      console.log("No payrolls due for processing.");
      return;
    }

    await Promise.all(
      duePayrolls.map(async (payroll) => {
        try {
          console.log(`Processing payroll: ${payroll.name}`);

          await processPayment(payroll); // Handle payment logic

          payroll.last_payroll = new Date();
          await payroll.save(); // Update last payroll date

          console.log(`Payroll processed successfully: ${payroll.name}`);
        } catch (error) {
          console.error(
            `Error processing payroll: ${payroll.name}`,
            JSON.stringify(error, null, 2)
          );
        }
      })
    );
  } catch (error) {
    console.error("Error fetching payrolls:", error);
  }
};

// Schedule the cron job to run every hour
cron.schedule("0 * * * *", async () => {
  console.log("Running payroll automation...");
  await processPayrolls();
});

app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is runnning successfully",
  });
});

app.use(ErrorHandler);

const server = app;
const PORT = process.env.PORT || 9000;

server.listen(PORT, async () => {
  console.log("server running");
  // await sequelize.sync();
  await sequelize.authenticate({ force: true });
  // await processPayrolls();

  console.log("database connected");
});
