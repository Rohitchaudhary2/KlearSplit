import { DataTypes } from "sequelize";

export default (sequelize) => {
  const AuditLog = sequelize.define(
    "audit_log",
    {
      "id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "operation_type": {
        "type": DataTypes.ENUM("INSERT", "UPDATE", "UPSERT", "DELETE"),
        "allowNull": false
      },
      "actor_id": {
        "type": DataTypes.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "table_name": {
        "type": DataTypes.STRING(100),
        "allowNull": false
      },
      "record_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "old_data": {
        "type": DataTypes.JSONB, // Stores the previous data for updates and deletes
        "allowNull": true
      },
      "new_data": {
        "type": DataTypes.JSONB, // Stores the new data for inserts and updates
        "allowNull": true
      },
      "createdAt": {
        "type": DataTypes.DATE,
        "allowNull": false,
        "defaultValue": DataTypes.NOW
      }
    },
    {
      "timestamps": false
    }
  );

  return AuditLog;
};
