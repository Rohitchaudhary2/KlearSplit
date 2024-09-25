import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/db.connection.js";
import userRouter from "./api/v1/users/userRoutes.js";
import authRouter from "./api/v1/auth/authRoutes.js";
import { errorMiddleware } from "./api/v1/middlewares/errorHandler.js";
import { loggerMiddleware } from "./api/v1/middlewares/loggerMiddleware.js";

// Creating an instance of the Express application
const app = express();

app.use(express.json());    // Parse incoming JSON requests and make the data available under req.body

const corsOptions = {
  origin: 'http://localhost:4200',   
  credentials: true,                  
  exposedHeaders: ["Authorization"]
}

app.use(cors(corsOptions)); // Enable Cross-Origin Resource Sharing (CORS) to allow requests from different origins
app.use(cookieParser());    // Parse cookies from incoming requests and make them available under req.cookies

sequelize.sync();           // Sync the Sequelize models with the database, creating tables if they don't exist

const PORT = process.env.PORT || 3000;

//Custom logger middleware to log incoming requests and their details
app.use(loggerMiddleware);

// Routes
app.use("/api/v1/users", userRouter);       // User-related routes
app.use("/api/v1/auth", authRouter);        // Authentication related routes

// ErrorMiddleware to handle any errors that occur during request processing
app.use(errorMiddleware);

// Starting the Express server and listening for incoming requests
app.listen(PORT, () => {
  `Server is listening on port ${PORT}`;
});
