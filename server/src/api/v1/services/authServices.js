import bcrypt from "bcryptjs"
import { getUserByEmailDb } from "../db/userDb.js"
import UserService from "./userServices.js"

class AuthService {
    static loginService = async (req) => {
        const {email, password} = req.body

        const user = await getUserByEmailDb(email)

        if(!user) throw Error

        const validPassword = bcrypt.compare(password, user.password)

        if(!validPassword) throw Error

        const accessToken = UserService.generateAccessToken(user.user_id)

        const refreshToken = UserService.generateRefreshToken(user.user_id)

        console.log(accessToken, refreshToken);

        return {user, accessToken, refreshToken}
    }
}

export default AuthService