import User from './userModel.js'

export const createUserDb = async (user) => await User.create(user)

export const getUserByIdDb = async(id) => await User.findByPk(id)

export const getUserByEmailDb = async(email) => await User.scope('withPassword').findOne({
    where: {
        email
    }
})

export const getUserByPhoneDb = async(phone) => await User.findOne({
    where:{
        phone
    }
})

export const updateUserDb = async(user, id) => await User.update(user, {
    where: {
        user_id: id
    },
    returning: true
})

export const deleteUserDb = async (id) => await User.destroy({
    where: {
        user_id: id
    }
})