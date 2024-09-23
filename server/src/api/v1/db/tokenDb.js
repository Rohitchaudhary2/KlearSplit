import RefreshToken from "../models/TokenModels/refreshTokenModel.js";

export const createRefreshTokenDb = async(token) => RefreshToken.create(token)

export const deleteRefreshTokenDb = async(token) => RefreshToken.destroy(token)

export const getRefreshTokenDb = async(token) => RefreshToken.findOne(token)