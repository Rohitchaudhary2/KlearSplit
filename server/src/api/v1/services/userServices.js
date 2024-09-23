import bcrypt from 'bcryptjs'
import { generatePassword } from '../utils/passwordGenerator.js';
import { createUserDb, getUserByIdDb, updateUserDb, deleteUserDb, getUserByEmailDb, getUserByPhoneDb } from '../db/userDb.js';
import { validateUpdatedUser, validateUser } from '../validations/userValidations.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenGenerator.js';
import AuthService from './authServices.js';

class UserService {
    static createUserService = async (user) => {
        const {error, value} = validateUser(user, { stripUnknown: true })

        if(error) throw error

        const isEmailExists = await getUserByEmailDb(value.email)
        if(isEmailExists) throw new Error('Email already exists')

        const isPhoneExists = await getUserByPhoneDb(value.phone)
        if(isPhoneExists) throw new Error('Phone number already exists')

        const password = generatePassword()
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)
        value.password = hashedPassword
        
        console.log(password) // Send mail for password to the user
        
        user = await createUserDb(value)  

        const accessToken = generateAccessToken(user.user_id)
        const refreshToken = generateRefreshToken(user.user_id)

        await AuthService.createRefreshTokenService({
            token: refreshToken,
            user_id: user.user_id
        })

        return {user, accessToken, refreshToken}
    }

    static getUserService = async(id) => await getUserByIdDb(id)
        
    static updateUserService = async(req) => {
        const userData = req.body
        const id = req.params.id
        const user = await getUserByIdDb(id)
        
        if(!user) throw new Error(`User does not exist`)

        const {error, value} = validateUpdatedUser(userData, { stripUnknown: true })

        if(error) throw error

        return await updateUserDb(value, id)
    }

    static deleteUserService = async(req) => {
        const id = req.params.id
        const user = await getUserByIdDb(id)
        if(!user) throw new Error(`User does not exist`)

        return await deleteUserDb(id)
    }
}

export default UserService