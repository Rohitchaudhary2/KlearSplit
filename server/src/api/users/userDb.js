import { Op } from "sequelize";
import { User } from "../../config/db.connection.js";

class UserDb {
  // Creates a new user in the database
  static createUser = async(user, transaction) =>
    await User.create(user, { transaction });

  // Restores a deleted user in the database
  static restoreUser = async(user, transaction) =>
    await user.restore({ transaction });

  // Retreives user data with the help of user_id
  static getUserById = async(id) => await User.findByPk(id);

  // Retrieves multiple users data based on the array of user_id provided in the same format in which array is provided
  static getUsersById = async(ids) => {
    const users = await User.findAll({
      "attributes": [ "first_name", "last_name", "user_id" ],
      "where": {
        "user_id": ids
      }
    });

    return users.sort(
      (a, b) => ids.indexOf(a.user_id) - ids.indexOf(b.user_id)
    );
  };

  // Retrieves users with the help of email
  static getUserByEmail = async(email, flag = true) =>
    await User.scope("withPassword").findOne({
      "where": {
        email
      },
      "paranoid": flag
    });

  // Retrieves user with the help of phone number
  static getUserByPhone = async(phone) =>
    await User.findOne({
      "where": {
        phone
      }
    });

  // Retrieves users based on provided regex
  static getUsersByRegex = async(regex, userId) => {
    const nameParts = regex.split(" ").filter(Boolean); // Split by space and remove empty values

    let whereCondition;

    if (nameParts.length > 1) {
      const [ firstNameRegex, lastNameRegex ] = nameParts;

      whereCondition = {
        [ Op.or ]: [
          { "email": { [ Op.iLike ]: `%${regex}%` } },
          {
            [ Op.and ]: [
              // Try to match both first_name and last_name
              { "first_name": { [ Op.iLike ]: `%${firstNameRegex}%` } },
              { "last_name": { [ Op.iLike ]: `%${lastNameRegex}%` } }
            ]
          },
          { "first_name": { [ Op.iLike ]: `%${regex}%` } },
          { "last_name": { [ Op.iLike ]: `%${regex}%` } }
        ]
      };
    } else {
      // If only one part (either first name or last name or email)
      whereCondition = {
        [ Op.or ]: [
          { "email": { [ Op.iLike ]: `%${regex}%` } },
          { "first_name": { [ Op.iLike ]: `%${regex}%` } },
          { "last_name": { [ Op.iLike ]: `%${regex}%` } }
        ]
      };
    }

    return await User.findAll({
      "where": {
        ...whereCondition,
        "user_id": {
          [ Op.ne ]: userId
        } },
      "attributes": [ "user_id", "email", "first_name", "last_name" ]
    });
  };

  // Updates user data
  static updateUser = async(user, id) => {
    const response = await User.update(user, {
      "where": {
        "user_id": id
      },
      "returning": true
    });

    if (response[ 0 ] === 0) {
      return 0;
    }

    return response[ 1 ];
  };

  // Soft deletes user data
  static deleteUser = async(user) => await user.destroy();

  static getUsers = async(users) => await User.findAll({
    "where": {
      "user_id": {
        [ Op.in ]: users
      }
    }
  });
}

export default UserDb;
