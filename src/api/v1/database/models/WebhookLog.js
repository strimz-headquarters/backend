const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class WebhookLog extends Model {
    static associate(models) {
      this.belongsTo(models.Merchant, {
        foreignKey: "merchant_id",
        as: "merchant",
      });
    }

    // Check if webhook was successful
    isSuccessful() {
      return this.status === "success";
    }

    // Check if should retry
    shouldRetry() {
      return this.status === "failed" && this.retry_count < 5;
    }
  }

  WebhookLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      merchant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      event_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isIn: {
            args: [
              [
                "payment.completed",
                "payment.failed",
                "payment.refunded",
                "withdrawal.completed",
                "merchant.updated",
              ],
            ],
            msg: "Invalid event type",
          },
        },
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "success", "failed"),
        defaultValue: "pending",
        allowNull: false,
      },
      response_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 100,
          max: 599,
        },
      },
      response_body: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 10,
        },
      },
      next_retry_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Request duration in milliseconds",
      },
    },
    {
      sequelize,
      modelName: "WebhookLog",
      tableName: "webhook_logs",
      indexes: [
        {
          fields: ["merchant_id"],
        },
        {
          fields: ["event_type"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["next_retry_at"],
        },
      ],
    }
  );
  return WebhookLog;
};
