import { NextFunction } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middleware/asyncHandlerr";
import { AuthService } from "./auth.service";
import { Request,Response} from "express";
import { registerschema } from "../../common/validators/auth.validators";

export class AuthController{
    private authservice: AuthService;

    constructor(authservice: AuthService){
        this.authservice= authservice;

    }
    public register = asyncHandler(async (req:Request, res:Response):Promise<any>=> {
        const userAgent = req.headers["user-agent"];
        const body = registerschema.parse({
            ...req.body,
            userAgent,
        });
        this.authservice.register(body);
        return res.status(HTTPSTATUS.CREATED).json({
            message:"User Registered Sucessfully"
        });
    })


}
