import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import socketHandler from "./api/socket/socket.js";
import { sequelize } from "./config/db.connection.js";
import passport from "./api/middlewares/googleStrategy.js";
import userRouter from "./api/users/userRoutes.js";
import authRouter from "./api/auth/authRoutes.js";
import { errorMiddleware } from "./api/middlewares/errorHandler.js";
import { loggerMiddleware } from "./api/middlewares/loggerMiddleware.js";
import friendRouter from "./api/friends/friendRoutes.js";
import dashboardRouter from "./api/dashboard/dashboardRoutes.js";

const app = express();

const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true,
};

const server = createServer(app); // Create HTTP server with Express app
const io = new Server(server, {
  cors: corsOptions,
});

// Initialize Socket.IO connection
socketHandler(io);

app.use(express.json()); // Parse incoming JSON requests and make the data available under req.body
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(cors(corsOptions)); // Enable Cross-Origin Resource Sharing (CORS) to allow requests from different origins
app.use(cookieParser()); // Parse cookies from incoming requests and make them available under req.cookies

sequelize.sync(); // Sync the Sequelize models with the database, creating tables if they don't exist

const PORT = process.env.PORT || 3000;

app.use(loggerMiddleware);

// Routes
app.use("/api/users", userRouter); // User-related routes
app.use("/api/auth", authRouter); // Authentication related routes
app.use("/api/friends", friendRouter); // Friend-related routes
app.use("/api/dashboard", dashboardRouter); // Dashboard-related routes

// ErrorMiddleware to handle any errors that occur during request processing
app.use(errorMiddleware);

// Starting the Express server and listening for incoming requests
server.listen(PORT, () => {
  `Server is listening on port ${PORT}`;
});
