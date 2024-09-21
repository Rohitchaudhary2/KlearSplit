import { Router } from 'express'
import { authController } from '../controllers/authController.js';

const authRouter = Router()

authRouter.post('/login', authController);

export default authRouter