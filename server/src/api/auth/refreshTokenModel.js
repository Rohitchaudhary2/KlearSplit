import { DataTypes } from "sequelize";
import sequelize from "../../config/db.connection.js";

const RefreshToken = sequelize.define(
  "refresh_token",
  {
    token_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    timestamps: false,
  },
);

export default RefreshToken;
