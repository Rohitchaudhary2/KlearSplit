import UserService from '../services/userServices.js';
 
export const createUserController = async (req, res, next) => {
    try{
        const userData = await UserService.createUserService(req.body)
        res.status(201)
        .set('Authorization', `Bearer ${userData.accessToken}`)
        .cookie('refreshToken', userData.refreshToken, { httpOnly: true, sameSite: 'strict' })
        .json({
            status: "success",
            message: "Successfully created user",
            user: userData.user
        })
    } catch(err){
        console.log(err)
        next(err)
    }
}

export const getUserController = async(req, res, next) => {
    try{
        const userData = await UserService.getUserService(req.params.id)
        res.status(200).json({
            status: "success",
            message: "Successfully fetched user",
            userData
        })
    } catch(err){
        console.log(err)
        next(err)
    }
}

export const updateUserController = async(req, res, next) => {
    try{
        const user = await UserService.updateUserService(req)

        res.status(200).json({
            status: "success",
            message: "Successfully updated user",
            user
        })
    } catch(err) {
        console.log(err)
        next(err)
    }
}

export const deleteUserController = async(req, res, next) => {
    try{
        const deletedUser = await UserService.deleteUserService(req)
        res.status(200).json({
            status: "success",
            message: "Successfully deleted user",
            deletedUser
        })
    } catch(err) {
        console.log(err)
        next(err)
    }
}