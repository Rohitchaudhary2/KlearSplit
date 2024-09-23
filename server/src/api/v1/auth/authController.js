import AuthService from "./authServices.js"
import { ResponseHandler } from "../utils/ResponseHandler.js"

export const loginController = async (req, res, next) => {
    try{
        const userData = await AuthService.loginService(req)
        res.status(200)
        .set('Authorization', `Bearer ${userData.accessToken}`)
        .cookie('refreshToken', userData.refreshToken, { httpOnly: true, sameSite: 'strict' })   
        .json(ResponseHandler("User login successful", userData.user))
    } catch(err){
        next(err)
    }
}

export const logoutController = async (req, res, next) => {
    try{   
        await AuthService.logoutService(req)   
        res.status(200)
        .set('Authorization', '')
        .clearCookie("refreshToken", { httpOnly: true, sameSite: 'strict'})
        .json(ResponseHandler("User logged out successfully"))
    } catch(err) {
        next(err)
    }
}