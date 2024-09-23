import RefreshToken from "./refreshTokenModel.js";

export const createRefreshTokenDb = async(token) => RefreshToken.create(token)

export const deleteRefreshTokenDb = async(token) => RefreshToken.destroy({
    where: {
        token
    }
})

export const getRefreshTokenDb = async(token) => RefreshToken.findOne({
    where: {
        token
    }
})