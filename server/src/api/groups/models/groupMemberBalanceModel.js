import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupMemberBalance = sequelize.define(
    "group_member_balance",
    {
      "balance_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "participant1_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "participant2_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "balance_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false,
        "defaultValue": 0
      }
    },
    {
      "tableName": "group_member_balance",
      "timestamps": true,
      "paranoid": true,
      "indexes": [
        // Define the composite unique index for group_id, participant1_id, and participant2_id
        {
          "unique": true,
          "fields": [
            "group_id",
            // Use a combination of LEAST and GREATEST to ensure order consistency
            sequelize.literal("LEAST(participant1_id, participant2_id)"),
            sequelize.literal("GREATEST(participant1_id, participant2_id)")
          ]
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

  return GroupMemberBalance;
};
