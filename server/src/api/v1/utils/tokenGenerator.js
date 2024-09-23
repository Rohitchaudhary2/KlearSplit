import jwt from 'jsonwebtoken'

export const generateAccessToken = (id) => {
    const accessToken = jwt.sign({id}, process.env.ACCESS_SECRET_KEY, {expiresIn: '1h'})

    return accessToken
}

export const generateRefreshToken = (id) => {
    const refreshToken = jwt.sign({id}, process.env.REFRESH_SECRET_KEY, {expiresIn: '10d'})

    

    return refreshToken
}
