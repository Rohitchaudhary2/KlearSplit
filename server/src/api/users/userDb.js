import User from "./models/userModel.js";

class UserDb {
  static createUser = async (user, transaction) =>
    await User.create(user, { transaction });

  static restoreUser = async (email, transaction) =>
    await User.restore({ where: { email }, transaction });

  static getUserById = async (id) => await User.findByPk(id);

  static getUserByEmail = async (email, flag = true) =>
    await User.scope("withPassword").findOne({
      where: {
        email,
      },
      paranoid: flag,
    });

  static getUserByPhone = async (phone) =>
    await User.findOne({
      where: {
        phone,
      },
    });

  static updateUser = async (user, id, transaction = null) =>
    await User.update(user, {
      where: {
        user_id: id,
      },
      transaction,
      returning: true,
    });

  static deleteUser = async (id) =>
    await User.destroy({
      where: {
        user_id: id,
      },
    });
}

export default UserDb;
