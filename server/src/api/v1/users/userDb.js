import { Op } from "sequelize";
import User from "./models/userModel.js";

export const createUserDb = async (user, transaction) =>
  await User.create(user, { transaction });

export const restoreUserDb = async (email, transaction) =>
  await User.restore({ where: { email }, transaction });

export const getUserByIdDb = async (id) => await User.findByPk(id);

export const getUserByEmailDb = async (email) =>
  await User.scope("withPassword").findOne({
    where: {
      email,
    },
  });

export const getUserByEmailorPhoneDb = async (email, phone, flag = true) =>
  await User.scope("withPassword").findOne({
    where: {
      [Op.or]: [{ email }, { phone }],
    },
    paranoid: flag,
  });

export const getUserByPhoneDb = async (phone) =>
  await User.findOne({
    where: {
      phone,
    },
  });

export const updateUserDb = async (user, id) =>
  await User.update(user, {
    where: {
      user_id: id,
    },
    returning: true,
  });

export const deleteUserDb = async (id) =>
  await User.destroy({
    where: {
      user_id: id,
    },
  });
