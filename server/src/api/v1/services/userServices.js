import bcrypt from 'bcryptjs'
import { defaultPassword } from '../utils/passwordGenerator.js';
import { createUserDb, getUserByIdDb, updateUserDb, deleteUserDb, getUserByEmailDb, getUserByPhoneDb } from '../db/userDb.js';

class UserService {
    static createUserService = async (user) => {
        const isEmailExists = await getUserByEmailDb(user.email)

        if(isEmailExists) throw new Error('Email already exists')

        const isPhoneExists = await getUserByPhoneDb(user.phone)

        if(isPhoneExists) throw new Error('Phone number already exists')

        const password = defaultPassword()
        
        console.log(password)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt)
        user.password = hashedPassword

        return await createUserDb(user)   
    }

    static getUserService = async(id) => await getUserByIdDb(id)
        
    static updateUserService = async(req) => {
        const userData = req.body
        const id = req.params.id
        const user = await getUserByIdDb(id)
        if(!user) throw new Error(`User does not exist`)

        return await updateUserDb(userData, id)
    }

    static deleteUserService = async(req) => {
        const id = req.params.id
        const user = await getUserByIdDb(id)
        if(!user) throw new Error(`User does not exist`)

        return await deleteUserDb(id)
    }
}

export default UserService