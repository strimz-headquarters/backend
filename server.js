require("dotenv").config();
const { sequelize } = require("./src/api/v1/database/models");
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

async function handle_cron() {
  try {
    /// check for due stream
  } catch (error) {}
}

// Schedule the cron job for 12 AM UTC every day
cron.schedule(
  "0 0 * * *",
  async () => {
    await handle_cron();
  },
  {
    timezone: "UTC", // Ensure the timezone is set to UTC
  }
);

app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is runnning successfully",
  });
});

const ErrorHandler = require("./src/api/v1/validations/error/ErrorHandler");
app.use(ErrorHandler);

const server = app;
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log("server running");
  // await sequelize.sync();
  await sequelize.authenticate({ force: true });
  console.log("database connected");
});
