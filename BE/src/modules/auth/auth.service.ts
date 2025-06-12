import { ErrorCode } from "../../common/enums/error-codes.enums";
import { VerificationEnum } from "../../common/enums/verification";
import { loginDTO, registerDTO } from "../../common/interfaces/auth.interface";
import { anHourFromNow, ONE_DAY_IN_MS, threeMinutesAgo } from "../../common/utils/date-time";
import {
  BadRequest,
  HttpException,
  InternalServerException,
  NotfoundException,
  UnauthorizedException,
} from "../../common/utils/catch-errors";
import { fortyFiveMinutesFromNow } from "../../common/utils/date-time";
import UserModel from "../../database/models/user.model";
import { appconfig } from "../../config/app.config";
import VerificationCodeModel, { VerificationCodeDocument } from "../../database/models/verification.model";
import { sendEmail } from "../../mailers/mailer";
import { passwordResetTemplate, verifyEmailTemplate } from "../../mailers/templates/templates";
import { logger } from "../../common/utils/logger";
import SessionModel, { SessionDocument } from "../../database/models/session.model";
import {verifyJwtToken,RefreshTPayload, signJwtToken,refreshTokenSignOptions } from "../../common/utils/jwt";
import { calculateExpirationDate } from "../../common/utils/date-time";
// import resetpasswordDTO from "../../common/interfaces/reset-password.interface";
import { resetPasswordDto } from "../../common/interfaces/auth.interface";
import { hashValue } from "../../common/utils/brcrypt";

export class AuthService{
    public async register(regitserdata: registerDTO){
        const { name, email, password, userAgent}= regitserdata;
        const existinguser = await UserModel.exists({
            email: email
        });
        if(existinguser){
            throw new BadRequest("user already exists with this email", ErrorCode.AUTH_EMAIL_ALREADY_EXISTS);
        }
        const newUser= await UserModel.create({
            name,email,password
        });
        const userId= newUser._id;

        const verification = await VerificationCodeModel.create({
            userId,
            type: VerificationEnum.EMAIL_VERIFICATION,
            expiresAt: fortyFiveMinutesFromNow(),

        });

        const verificationUrl = `${appconfig.APP_ORIGIN}/confirm-account?code=${verification.code}`;
        await sendEmail({
            to: newUser.email,
            ...verifyEmailTemplate(verificationUrl)
        }
        );

        return{
            user: newUser,
        }

    }

    public async login(loginData: loginDTO){
        const { email, password, userAgent } = loginData;

            logger.info(`Login attempt for email: ${email}`);
            const user = await UserModel.findOne({
                email: email,
            });

            if (!user) {
                 logger.warn(`Login failed: User with email ${email} not found`);
                    throw new BadRequest(
                    "Invalid email or password provided",
                    ErrorCode.AUTH_USER_NOT_FOUND
                    );
                }
                const isPasswordValid = await user.comparePassword(password);
                if (!isPasswordValid) {
                logger.warn(`Login failed: Invalid password for email: ${email}`);
                throw new BadRequest(
                    "Invalid email or password provided",
                    ErrorCode.AUTH_USER_NOT_FOUND
             );
            }
                    if (user.userPreferences.enable2FA) {
            logger.info(`2FA required for user ID: ${user._id}`);
            return {
                user: null,
                mfaRequired: true,
                accessToken: "",
                refreshToken: "",
            };
            }

    logger.info(`Creating session for user ID: ${user._id}`);
    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    logger.info(`Signing tokens for user ID: ${user._id}`);
    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions
    );

    logger.info(`Login successful for user ID: ${user._id}`);
    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    };

    }
    public async refreshToken(refreshToken: string) {
        const { payload } = verifyJwtToken<RefreshTPayload>(refreshToken, {
        secret: refreshTokenSignOptions.secret,
        });

        if (!payload) {
        throw new UnauthorizedException("Invalid refresh token");
        }

        const session = await SessionModel.findById(payload.sessionId);
        const now = Date.now();

        if (!session) {
        throw new UnauthorizedException("Session does not exist");
        }

        if (session.expiredAt.getTime() <= now) {
        throw new UnauthorizedException("Session expired");
        }

        const sessionRequireRefresh =
        session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;

        if (sessionRequireRefresh) {
        session.expiredAt = calculateExpirationDate(
            appconfig.JWT.REFRESH_EXPIRES_IN
        );
        await session.save();
        }

        const newRefreshToken = sessionRequireRefresh
        ? signJwtToken(
            {
                sessionId: session._id,
            },
            refreshTokenSignOptions
            )
        : undefined;

        const accessToken = signJwtToken({
        userId: session.userId,
        sessionId: session._id,
        });

        return {
        accessToken,
        newRefreshToken,
        };
  }

  public async verifyEmail(code: string){
    const validCode = await VerificationCodeModel.findOne({
      code: code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });

    if(!validCode) {
      throw new NotfoundException("Verification code not found or expired", ErrorCode.AUTH_UNAUTHORIZED_ACCESS);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        validCode.userId,
        { isEmailVerified: true },
        { new: true }
        );

    // if (!updatedUser) {
    //   throw new InternalServerException("Failed to update user email verification status", ErrorCode.AUTH_INTERNAL_ERROR);
    // }
    if (!updatedUser) {
      throw new BadRequest(
        "Unable to verify email address",
        ErrorCode.VALIDATION_ERROR
      );
    }


    await validCode.deleteOne();
    return {
      message: "Email verified successfully",
      user: updatedUser,
    };    

  }
  public async forgotPassword(email: string) {

    const user = await UserModel.findOne({
      email: email,
    });
    if (!user) {
      throw new NotfoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND);
    }   

    const timeago = threeMinutesAgo();

    const maxAttempts = 2;

    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
        type: VerificationEnum.PASSWORD_RESET,
        createdAt: { $gt: timeago },
    });
    if (count >= maxAttempts) {
      throw new BadRequest(
        "Maximum password reset attempts exceeded. Please try again later.",
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS
      );
    }   
    
    const expiresAt = anHourFromNow();

    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });

    const resetLink = `${appconfig.APP_ORIGIN}/reset-password?code=${
      validCode.code
    }&exp=${expiresAt.getTime()}`;

    const { data, error } = await sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink),
    });

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} ${error?.message}`);
    }

    return {
      url: resetLink,
      emailId: data.id,
    };

  }

  public async resetPassword({password,verificationCode}: resetPasswordDto) {
     const validCode = await VerificationCodeModel.findOne({
      code: verificationCode,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt: { $gt: new Date() },
    });
    if (!validCode) {
      throw new NotfoundException("Verification code not found or expired", ErrorCode.AUTH_UNAUTHORIZED_ACCESS);
    }


    const hashedPassword = await hashValue(password);

    const updatedUser = await UserModel.findByIdAndUpdate(
        validCode.userId,{
            password: hashedPassword,
        }
    );

    if(!updatedUser) {
      throw new BadRequest("Failed to reset password");
    }

    await validCode.deleteOne();

    await SessionModel.deleteMany({
      userId: updatedUser._id,
    });

    return{
        user: updatedUser,
        message: "Password reset successfully. You can now log in with your new password.",


    }
}

    public async logout(sessionId: string) {
     return await SessionModel.findByIdAndDelete(sessionId);
    }




  



}
