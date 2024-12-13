import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import socketHandler from "./api/socket/socket.js";
import { sequelize } from "./config/db.connection.js";
import passport from "./api/middlewares/googleStrategy.js";
import { errorMiddleware } from "./api/middlewares/errorHandler.js";
import { loggerMiddleware } from "./api/middlewares/loggerMiddleware.js";
import routes from "./appRoutes.js";

const app = express();
const corsOptions = {
  "origin": "http://localhost:4200",
  "credentials": true
};
const server = createServer(app); // Create HTTP server with Express app
const io = new Server(server, {
  "cors": corsOptions
});
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO connection
socketHandler(io);

app.use(express.json()); // Parse incoming JSON requests and make the data available under req.body
app.use(express.urlencoded({ "extended": true }));
app.use(passport.initialize());

app.use(cors(corsOptions)); // Enable Cross-Origin Resource Sharing (CORS) to allow requests from different origins
app.use(cookieParser()); // Parse cookies from incoming requests and make them available under req.cookies

app.use("/uploads", express.static("uploads")); // Serve static files from the uploads directory

await sequelize.sync(); // Sync the Sequelize models with the database, creating tables if they don't exist

app.use(loggerMiddleware);

// Routes
routes(app);

// ErrorMiddleware to handle any errors that occur during request processing
app.use(errorMiddleware);

// Starting the Express server and listening for incoming requests
server.listen(PORT, () => `Server is listening on port ${ PORT }`);
