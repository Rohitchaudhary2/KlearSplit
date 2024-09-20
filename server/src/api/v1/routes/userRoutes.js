import { Router } from "express";
import { createUserController, getUserController, updateUserController, deleteUserController } from "../controllers/userControllers.js";

const userRouter = Router()


userRouter.post('/register', createUserController)
userRouter.get('/:id', getUserController)
userRouter.patch('/:id', updateUserController)
userRouter.delete('/:id', deleteUserController)


export default userRouter;