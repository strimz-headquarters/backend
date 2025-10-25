const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Subscription extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "userId" });
      this.belongsTo(models.Merchant, { foreignKey: "merchantId" });
      this.hasMany(models.Payment, { foreignKey: "subscriptionId" });
    }
  }

  Subscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      merchantId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "expired", "cancelled", "pending"),
        defaultValue: "pending",
      },
      amount: {
        type: DataTypes.DECIMAL(36, 18),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
      },
      endDate: {
        type: DataTypes.DATE,
      },
      nextBillingDate: {
        type: DataTypes.DATE,
      },
      autoRenew: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Subscription",
      tableName: "subscriptions",
    }
  );

  return Subscription;
};
