import AuthService from "../services/authService.js"

export const authController = async (req, res) => {
    try{
        const user = await AuthService.loginService(req)
        res.status(200).json({
            status: "failure",
            message: "Email or Password is wrong.",
            user
        })
    } catch(err){
        res.status(400).json({
            status: "failure",
            message: "Email or Password is wrong.",
            error: err.message
        })
    }
}