import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupMember = sequelize.define(
    "group_member",
    {
      "group_membership_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "inviter_id": {
        "type": DataTypes.UUID,
        "allowNull": true
      },
      "member_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "status": {
        "type": DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        "allowNull": false,
        "defaultValue": "PENDING"
      },
      "role": {
        "type": DataTypes.ENUM("CREATOR", "ADMIN", "COADMIN", "USER"),
        "allowNull": false,
        "defaultValue": "USER"
      },
      "has_archived": {
        "type": DataTypes.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
      },
      "has_blocked": {
        "type": DataTypes.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
      }
    },
    {
      "timestamps": true,
      "paranoid": true,
      "indexes": [
        {
          "unique": true,
          "fields": [ "group_id", "member_id" ]
        }
      ]
    }
  );

  //   GroupMember.beforeDestroy(async (user, options) => {
  //     const transaction = options.transaction;
  //     const userId = user.user_id;

  //     // Soft delete friends where the user is either friend1 or friend2
  //     await Friend.update(
  //       { deletedAt: new Date() },
  //       {
  //         where: {
  //           [Op.and]: [
  //             { status: { [Op.ne]: "REJECTED" } },
  //             { [Op.or]: [{ friend1_id: userId }, { friend2_id: userId }] },
  //           ],
  //         },
  //         transaction,
  //       },
  //     );
  //     await FriendExpense.update(
  //       { deletedAt: new Date() },
  //       {
  //         where: {
  //           [Op.or]: [{ payer_id: userId }, { debtor_id: userId }],
  //         },
  //         transaction,
  //       },
  //     );
  //   });

  //   GroupMember.afterRestore(async (user, options) => {
  //     const transaction = options.transaction;
  //     const userId = user.user_id;

  //     // Soft delete friends where the user is either friend1 or friend2
  //     await Friend.update(
  //       { deletedAt: null },
  //       {
  //         where: {
  //           [Op.and]: [
  //             { status: { [Op.ne]: "REJECTED" } },
  //             { [Op.or]: [{ friend1_id: userId }, { friend2_id: userId }] },
  //           ],
  //         },
  //         transaction,
  //         paranoid: false,
  //       },
  //     );
  //     await FriendExpense.update(
  //       { deletedAt: null },
  //       {
  //         where: {
  //           [Op.or]: [{ payer_id: userId }, { debtor_id: userId }],
  //         },
  //         transaction,
  //         paranoid: false,
  //       },
  //     );
  //   });

  return GroupMember;
};
