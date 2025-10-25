const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      this.belongsTo(models.Subscription, { foreignKey: "subscriptionId" });
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      merchantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(36, 18),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      txHash: {
        type: DataTypes.STRING,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "failed"),
        defaultValue: "pending",
      },
      type: {
        type: DataTypes.ENUM("initial", "renewal", "manual"),
        defaultValue: "initial",
      },
    },
    {
      sequelize,
      modelName: "Payment",
      tableName: "payments",
    }
  );

  return Payment;
};
