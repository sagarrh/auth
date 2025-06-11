import { ErrorCode } from "../../common/enums/error-codes.enums";
import { VerificationEnum } from "../../common/enums/verification";
import { loginDTO, registerDTO } from "../../common/interfaces/auth.interface";
import { BadRequest, HttpException } from "../../common/utils/catch-errors";
import { fortyFiveMinutesFromNow } from "../../common/utils/date-time";
import UserModel from "../../database/models/user.model";
import { appconfig } from "../../config/app.config";
import VerificationCodeModel, { VerificationCodeDocument } from "../../database/models/verification.model";
import { sendEmail } from "../../mailers/mailer";
import { verifyEmailTemplate } from "../../mailers/templates/templates";
import { logger } from "../../common/utils/logger";
import SessionModel, { SessionDocument } from "../../database/models/session.model";

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

}
