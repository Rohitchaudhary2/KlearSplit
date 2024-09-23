import jwt from 'jsonwebtoken'
import AuthService from '../services/authServices.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenGenerator.js';
import { ErrorHandler } from './ErrorHandler.js';
import UserService from '../services/userServices.js';

export const authenticateToken = async (req, res, next) => {
  if (!req.headers['authorization'] && !req.cookies['refreshToken']) {
    return res.status(401).send('Access Denied. No token provided.');
  }
  
  try {
    const accessToken = req.headers['authorization'].split(" ")[1]
    const user = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = await UserService.getUserService(user.id)
    next();
  } catch (error) {
    console.log(error)
    const refreshToken = req.cookies['refreshToken']
    if(!refreshToken) throw new ErrorHandler(401, 'Access Denied. No refresh token provided.')

    try {
      const refreshTokenDb = await AuthService.getRefreshTokenService(refreshToken)

      if(refreshToken !== refreshTokenDb) throw ErrorHandler(401, 'Access Denied. Invalid Token')
      
      const userId = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
          
      const accessToken = generateAccessToken(userId.id)
      const newRefreshToken = generateRefreshToken(userId.id)

      const user = await UserService.getUserService(userId.id)
    
      res.cookie('refreshToken', newRefreshToken, { httpOnly: true, sameSite: 'strict' })
        .set('Authorization', accessToken)
        .send(user);
      } catch (error) {
        next(error)
    }
  }
};