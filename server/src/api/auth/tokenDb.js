import RefreshToken from "./refreshTokenModel.js";

export const createRefreshTokenDb = async (token, transaction) =>
  RefreshToken.create(token, { transaction });

export const deleteRefreshTokenDb = async (token) =>
  RefreshToken.destroy({
    where: {
      token,
    },
  });

export const getRefreshTokenDb = async (token) =>
  RefreshToken.findOne({
    where: {
      token,
    },
  });
