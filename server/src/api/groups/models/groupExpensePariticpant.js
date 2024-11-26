import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupExpenseParticipant = sequelize.define(
    "group_expense_participant",
    {
      expense_participant_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      group_expense_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "group_expenses",
          key: "group_expense_id",
        },
      },
      debtor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "groups_members",
          key: "group_membership_id",
        },
      },
      debtor_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      paranoid: true,
    },
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

  return GroupExpenseParticipant;
};
