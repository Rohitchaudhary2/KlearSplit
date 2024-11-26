import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Group = sequelize.define(
    "group",
    {
      "group_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_name": {
        "type": DataTypes.STRING(100),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "Group name can't be empty."
          }
        }
      },
      "group_description": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      },
      "creator_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "image_url": {
        "type": DataTypes.STRING(255),
        "defaultValue":
          "https://www.google.com/url?sa=i&url=https%3A%2F%2Fen.silhouette-ac.com%2Fsilhouette%2F143023%2Fgroup-of-three-people&psig=AOvVaw31ToMuast5syZwRrvivnmA&ust=1731416089810000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCMCS492p1IkDFQAAAAAdAAAAABAE",
        "allowNull": false
      }
    },
    {
      "timestamps": true,
      "paranoid": true
    }
  );

  //   Group.beforeDestroy(async (user, options) => {
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

  //   Group.afterRestore(async (user, options) => {
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

  return Group;
};
