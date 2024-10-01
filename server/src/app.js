import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/db.connection.js";
import passport from "./api/middlewares/googleStrategy.js";
import userRouter from "./api/users/userRoutes.js";
import authRouter from "./api/auth/authRoutes.js";
import { errorMiddleware } from "./api/middlewares/errorHandler.js";
import { loggerMiddleware } from "./api/middlewares/loggerMiddleware.js";

const app = express();

app.use(express.json()); // Parse incoming JSON requests and make the data available under req.body
app.use(passport.initialize());

const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true,
  exposedHeaders: ["Authorization"],
};

app.use(cors(corsOptions)); // Enable Cross-Origin Resource Sharing (CORS) to allow requests from different origins
app.use(cookieParser()); // Parse cookies from incoming requests and make them available under req.cookies

sequelize.sync(); // Sync the Sequelize models with the database, creating tables if they don't exist

const PORT = process.env.PORT || 3000;

app.use(loggerMiddleware);

// Routes
app.use("/api/users", userRouter); // User-related routes
app.use("/api/auth", authRouter); // Authentication related routes
app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
);

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:4200/login",
  }),
  (req, res) => {
    const userData = {
      user: req.user.user.dataValues,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    };
    res
      .cookie("accessToken", userData.accessToken, {
        httpOnly: true,
        sameSite: "strict",
      })
      .cookie("refreshToken", userData.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      })
      .redirect(`http://localhost:4200/dashboard?id=${userData.user.user_id}`);
  },
);

// ErrorMiddleware to handle any errors that occur during request processing
app.use(errorMiddleware);

// Starting the Express server and listening for incoming requests
app.listen(PORT, () => {
  `Server is listening on port ${PORT}`;
});
