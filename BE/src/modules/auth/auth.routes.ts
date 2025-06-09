import { Router } from "express";
import { authcontroller } from "./auth.module";

const authroute = Router()
authroute.post("/register",authcontroller.register);


export default authroute;
