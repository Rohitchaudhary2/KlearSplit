export class ErrorHandler extends Error {
    constructor(statusCode, message){
        super(message)
        this.statusCode = statusCode
        this.message = message
        // Error.captureStackTrace(this,this.constructor);
    }
}

export const ErrorMiddleware = (error, req, res, next) => {
    const statusCode = error.statusCode || 500
    const message = statusCode===500 ?  'Internal Server Error' : error.message

    return res.status(statusCode).json({
        success: false, 
        message
    })
}