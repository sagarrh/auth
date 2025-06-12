import { Router } from "express";
import { authcontroller } from "./auth.module";

const authroute = Router()
authroute.post("/register",authcontroller.register);
authroute.post("/login", authcontroller.login);
authroute.post("/verify/email", authcontroller.verifyEmail);
authroute.post("/password/forgot", authcontroller.forgotPassword);
authroute.post("/password/reset", authcontroller.resetPassword);
authroute.post("/logout", authenticateJWT, authcontroller.logout);

export default authroute;
