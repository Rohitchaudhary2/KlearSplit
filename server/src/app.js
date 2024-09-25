import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/db.connection.js";
import userRouter from "./api/v1/users/userRoutes.js";
import authRouter from "./api/v1/auth/authRoutes.js";
import { ErrorMiddleware } from "./api/v1/middlewares/ErrorHandler.js";
import { loggerMiddleware } from "./api/v1/middlewares/loggerMiddleware.js";

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:4200',    // Allow requests from this origin
  credentials: true,                  // Allow credentials (cookies, authorization headers, etc.)
  exposedHeaders: ["Authorization"]
}));
app.use(cookieParser());
sequelize.sync();

const PORT = process.env.PORT || 3000;

app.use(loggerMiddleware);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);

app.use(ErrorMiddleware);
app.listen(PORT, () => {
  `Server is listening on port ${PORT}`;
});
