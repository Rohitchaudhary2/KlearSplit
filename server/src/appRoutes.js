import userRouter from "./api/users/userRoutes.js";
import authRouter from "./api/auth/authRoutes.js";
import friendRouter from "./api/friends/friendRoutes.js";
import dashboardRouter from "./api/dashboard/dashboardRoutes.js";
import groupRouter from "./api/groups/groupRoutes.js";
import paymentRouter from "./api/payment/paymentRoutes.js";
import whatsappRouter from "./api/whatsapp/whatsappRoutes.js";

const routes = (app) => {
  // User-related routes
  app.use("/api/users", userRouter);

  // Authentication related routes
  app.use("/api/auth", authRouter);

  // Friend-related routes
  app.use("/api/friends", friendRouter);

  // Dashboard-related routes
  app.use("/api/dashboard", dashboardRouter);

  // Group-related routes
  app.use("/api/groups", groupRouter);

  // Payment-related routes
  app.use("/api/payments", paymentRouter);

  // Whatsapp webhook routes
  app.use("/api/whatsapp", whatsappRouter);
};

export default routes;
