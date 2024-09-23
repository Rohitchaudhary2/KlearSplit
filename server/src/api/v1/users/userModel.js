import { DataTypes } from "sequelize";

import sequelize from "../../../config/db.connection.js"
const User = sequelize.define("user", {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        args: true,
        msg: "Please enter a valid email address"
      }
    }
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  image_url: {
    type: DataTypes.STRING(255),
    defaultValue: "https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L3Y5MzctYWV3LTEzOS5qcGc.jpg",
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  notification_settings: {
    type: DataTypes.SMALLINT,
    allowNull: false,
    defaultValue: 63
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  paranoid: true,
  defaultScope: {
    attributes: {
      exclude: ['password', 'createdAt', 'updatedAt', 'deletedAt', 'is_admin', 'notification_settings']
    }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

export default User