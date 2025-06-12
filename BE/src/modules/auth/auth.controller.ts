import { NextFunction } from "express";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middleware/asyncHandlerr";
import { AuthService } from "./auth.service";
import { Request,Response} from "express";
import { registerSchema ,loginSchema,resetPasswordSchema,verificationEmailSchema ,emailSchema} from "../../common/validators/auth.validators";
import { authservice } from "./auth.module";
import { setAuthenticationCookies, clearAuthenticationCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "../../common/utils/cookie";
import { UnauthorizedException,NotfoundException } from "../../common/utils/catch-errors";
// import { AuthService } from "./auth.service";


export class AuthController{
    private authservice: AuthService;

    constructor(authservice: AuthService){
        this.authservice= authservice;

    }
    public register = asyncHandler(async (req:Request, res:Response):Promise<any>=> {
        const userAgent = req.headers["user-agent"];
        const body = registerSchema.parse({
            ...req.body,
            userAgent,
        });
        this.authservice.register(body);
        return res.status(HTTPSTATUS.CREATED).json({
            message:"User Registered Sucessfully"
        });
        
    })
   public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.headers["user-agent"];
      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      });

      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authservice.login(body);

      if (mfaRequired) {
        return res.status(HTTPSTATUS.OK).json({
          message: "Verify MFA authentication",
          mfaRequired,
          user,
        });
      }

      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: "User login successfully",
          mfaRequired,
          user,
        });
    }
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const refreshToken = req.cookies.refreshToken as string | undefined;
      if (!refreshToken) {
        throw new UnauthorizedException("Missing refresh token");
      }

      const { accessToken, newRefreshToken } =
        await this.authservice.refreshToken(refreshToken);

      if (newRefreshToken) {
        res.cookie(
          "refreshToken",
          newRefreshToken,
          getRefreshTokenCookieOptions()
        );
      }

      return res
        .status(HTTPSTATUS.OK)
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .json({
          message: "Refresh access token successfully",
        });
    }
  );

  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code } = verificationEmailSchema.parse(req.body);
      await this.authservice.verifyEmail(code);

      return res.status(HTTPSTATUS.OK).json({
        message: "Email verified successfully",
      });
    }
  );

  public forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const email = emailSchema.parse(req.body.email);
      await this.authservice.forgotPassword(email);

      return res.status(HTTPSTATUS.OK).json({
        message: "Password reset email sent",
      });
    }
  );

  public resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = resetPasswordSchema.parse(req.body);

      await this.authservice.resetPassword(body);

      return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
        message: "Reset Password successfully",
      });
    }
  );

  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const sessionId = req.body.sessionId
      if (!sessionId) {
        throw new NotfoundException("Session is invalid.");
      }
      await this.authservice.logout(sessionId);
      return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
        message: "User logout successfully",
      });
    }
  );


}
