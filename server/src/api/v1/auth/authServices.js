import bcrypt from "bcryptjs"
import { getUserByEmailDb } from "../users/userDb.js"
import { createRefreshTokenDb, deleteRefreshTokenDb, getRefreshTokenDb } from './tokenDb.js'
import { ErrorHandler } from "../middlewares/ErrorHandler.js"
import { generateAccessToken, generateRefreshToken } from "../utils/tokenGenerator.js"

class AuthService {
    static loginService = async (req) => {
        const {email, password} = req.body

        const user = await getUserByEmailDb(email)
        if(!user) throw new ErrorHandler(404, 'Email not found')

        const validPassword = bcrypt.compare(password, user.password)
        if(!validPassword) throw new ErrorHandler(404, 'Password is wrong')

        const accessToken = generateAccessToken(user.user_id)
        const refreshToken = generateRefreshToken(user.user_id)

        this.createRefreshTokenService({
            token: refreshToken,
            user_id: user.user_id
        })

        return {user, accessToken, refreshToken}
    }

    static logoutService = async (req) => {
        const refreshToken = req.cookies['refreshToken']

        const isDeleted = await deleteRefreshTokenDb(refreshToken)

        return isDeleted
    }

    static createRefreshTokenService = async(refreshToken) => {
        const createdRefreshToken = await createRefreshTokenDb(refreshToken)
        if(!createRefreshTokenDb) throw new ErrorHandler(500, 'Error while storing refresh Token')
        return createdRefreshToken
    }

    static getRefreshTokenService = async(req) => await getRefreshTokenDb(req)
}

export default AuthService