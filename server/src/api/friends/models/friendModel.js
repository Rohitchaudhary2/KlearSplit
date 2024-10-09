import { DataTypes } from "sequelize";

import sequelize from "../../../config/db.connection.js";
import User from "../../users/models/userModel.js";

const Friend = sequelize.define(
  "friends",
  {
    conversation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    friend1_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    friend2_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    balance_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    archival_status: {
      type: DataTypes.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"),
      allowNull: false,
      defaultValue: "NONE",
    },
    block_status: {
      type: DataTypes.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"),
      allowNull: false,
      defaultValue: "NONE",
    },
  },
  {
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
    },
  },
);

Friend.belongsTo(User, {
  foreignKey: "friend1_id",
  as: "friend1", // Alias for friend1
});

Friend.belongsTo(User, {
  foreignKey: "friend2_id",
  as: "friend2", // Alias for friend2
});

export default Friend;
