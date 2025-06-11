import { appconfig } from "../config/app.config";
import { resend } from "./resendclient";

type Params = {
    to :string | string[],
    from?: string,
    subject : string,
    text: string,
    html: string;
};

const mailer_sender =
  appconfig.NODE_ENV === "development"
    ? `no-reply <onboarding@resend.dev>`
    : `no-reply <${appconfig.MAILER_SENDER}>`;

export const sendEmail = async ({
  to,
  from = mailer_sender,
  subject,
  text,
  html,
}: Params) =>
  await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    text,
    subject,
    html,
  });
