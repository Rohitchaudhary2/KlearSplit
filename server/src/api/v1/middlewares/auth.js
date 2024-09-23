import jwt from 'jsonwebtoken'
import AuthService from '../auth/authServices.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenGenerator.js';
import { ErrorHandler } from './ErrorHandler.js';
import UserService from '../users/userServices.js';

export const authenticateToken = async (req, res, next) => {
  if (!req.headers['authorization'] && !req.cookies['refreshToken']) {
    throw next(new ErrorHandler(401, 'Access Denied. No token provided.'))
  }
  
  try {
    if(!req.headers['authorization']) throw error
    const accessToken = req.headers['authorization'].split(" ")[1]
    const user = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = await UserService.getUserService(user.id)
    next();
  } catch (error) {
    const refreshToken = req.cookies['refreshToken']
    
    if(!refreshToken) throw next(new ErrorHandler(401, 'Access Denied. No Refresh token provided.'))

    try {
      const refreshTokenDb = await AuthService.getRefreshTokenService(refreshToken)
      if(!refreshTokenDb) throw next(new ErrorHandler(401, 'Access Denied. Invalid Token'))
      
      const userId = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
          
      const accessToken = generateAccessToken(userId.id)
      const newRefreshToken = generateRefreshToken(userId.id)

      req.user = await UserService.getUserService(userId.id)      
    
      res.cookie('refreshToken', newRefreshToken, { httpOnly: true, sameSite: 'strict' })
        .set('Authorization', accessToken)
        // .send(user);
        next()
      } catch (error) {
        next(error)
    }
  }
};