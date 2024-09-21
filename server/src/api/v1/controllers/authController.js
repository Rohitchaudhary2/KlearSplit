import AuthService from "../services/authServices.js"

export const loginController = async (req, res) => {
    try{
        const userData = await AuthService.loginService(req)
        res.status(200)
        .set('Authorization', `Bearer ${userData.accessToken}`)
        .cookie('refreshToken', userData.refreshToken, { httpOnly: true, sameSite: 'strict' })   
        .json({
            status: "success",
            message: "User login successful",
            user: userData.user,
        })
    } catch(err){
        res.status(400).json({
            status: "failure",
            message: "Email or Password is wrong.",
            error: err.message
        })
    }
}

export const logoutController = (req, res) => {
    try{
        res.status(200)
        .set('Authorization', '')
        .clearCookie("refreshToken", { httpOnly: true, sameSite: 'strict'})
        .json({
            status: "success",
            message: "User logged out successfully"
        })
    } catch(err) {
        res.status(400).json({
            status: "failure",
            message: "Error while logging out",
            error: err
        })
    }
}