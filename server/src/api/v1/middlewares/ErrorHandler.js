export class ErrorHandler extends Error {
    constructor(statusCode, message){
        super(message)
        this.statusCode = statusCode
    }
}

export const ErrorMiddleware = (error, req, res) => {
    console.log(error.message)

    const statusCode = error.statusCode || 500
    const message = error.message || 'Internal Server Error'

    return res.status(statusCode).json({
        success: false, 
        message
    })
}