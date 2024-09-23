import bcrypt from "bcryptjs"
import { getUserByEmailDb } from "../db/userDb.js"
import UserService from "./userServices.js"
import { createRefreshTokenDb, deleteRefreshTokenDb, getRefreshTokenDb } from '../db/tokenDb.js'
import { ErrorHandler } from "../middlewares/ErrorHandler.js"

class AuthService {
    static loginService = async (req) => {
        const {email, password} = req.body

        const user = await getUserByEmailDb(email)
        if(!user) throw new ErrorHandler(404, 'Email not found')

        const validPassword = bcrypt.compare(password, user.password)
        if(!validPassword) throw new ErrorHandler(404, 'Password is wrong')

        const accessToken = UserService.generateAccessToken(user.user_id)
        const refreshToken = UserService.generateRefreshToken(user.user_id)

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