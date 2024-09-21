import bcrypt from "bcryptjs"
import { getUserByEmailDb } from "../db/userDb.js"

class AuthService {
    static loginService = async (req) => {
        const {email, password} = req.body

        const user = await getUserByEmailDb(email)

        if(!user) throw Error
        console.log(password, user.password);

        const validPassword = bcrypt.compare(password, user.password)

        if(!validPassword) console.log('jgsj');
    }
}

export default AuthService