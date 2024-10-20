import { Op } from "sequelize";
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

  static getUsersByRegex = async (regex) => {
    const nameParts = regex.split(" ").filter(Boolean); // Split by space and remove empty values

    let whereCondition;

    if (nameParts.length > 1) {
      const [firstNameRegex, lastNameRegex] = nameParts;

      whereCondition = {
        [Op.or]: [
          { email: { [Op.iLike]: `%${regex}%` } },
          {
            [Op.and]: [
              // Try to match both first_name and last_name
              { first_name: { [Op.iLike]: `%${firstNameRegex}%` } },
              { last_name: { [Op.iLike]: `%${lastNameRegex}%` } },
            ],
          },
          { first_name: { [Op.iLike]: `%${regex}%` } },
          { last_name: { [Op.iLike]: `%${regex}%` } },
        ],
      };
    } else {
      // If only one part (either first name or last name or email)
      whereCondition = {
        [Op.or]: [
          { email: { [Op.iLike]: `%${regex}%` } },
          { first_name: { [Op.iLike]: `%${regex}%` } },
          { last_name: { [Op.iLike]: `%${regex}%` } },
        ],
      };
    }

    return await User.findAll({
      where: whereCondition,
      attributes: ["user_id", "email", "first_name", "last_name"],
    });
  };

  static updateUser = async (user, id, transaction = null) => {
    const [numberOfAffectedRows, [updatedUser]] = await User.update(user, {
      where: {
        user_id: id,
      },
      transaction,
      returning: true,
    });

    if (numberOfAffectedRows === 0) {
      throw new Error("User not found or no changes made.");
    }

    return updatedUser;
  };

  static deleteUser = async (id) =>
    await User.destroy({
      where: {
        user_id: id,
      },
    });
}

export default UserDb;
