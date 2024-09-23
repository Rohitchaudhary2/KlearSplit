import jwt from 'jsonwebtoken'
import { getUserByIdDb } from '../db/userDb.js';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenGenerator.js';

export const authenticateToken = async (req, res, next) => {
  if (!req.headers['authorization'] && !req.cookies['refreshToken']) {
    return res.status(401).send('Access Denied. No token provided.');
  }
  
  try {
    const accessToken = req.headers['authorization'].split(" ")[1]
    const user = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = await getUserByIdDb(user.id);
    next();
  } catch (error) {
    if (!req.cookies['refreshToken']) {
      return res.status(401).json({
          status: "failure",
          message: 'Access Denied. No refresh token provided.',
          error: error.message
      });
    }

  try {
    const refreshToken = req.cookies['refreshToken']
    
    const userId = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
        
    const accessToken = generateAccessToken(userId.id)

    const newRefreshToken = generateRefreshToken(userId.id)

    const user = await getUserByIdDb(userId.id)
  
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, sameSite: 'strict' })
      .header('Authorization', accessToken)
      .send(user);
    } catch (error) {
      res.status(400).json({
          status: "failure",
          message: 'Invalid Token.',
          error: error.message
      });
    }
  }
};