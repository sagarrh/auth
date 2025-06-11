import { Resend } from "resend";
import { appconfig } from "../config/app.config";

export const resend = new Resend(appconfig.RESEND_API_KEY)
