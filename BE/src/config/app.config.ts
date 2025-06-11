import { getEnv } from "../common/utils/getenv";
// const export BASEPATH= "/something";
export const appconfig = {
    // APP_NAME: getEnv("APP_NAME", "MyApp"),
    RESEND_API_KEY: getEnv("RESEND_API_KEY"),
    NODE_ENV : getEnv("NODE_ENV", "development"),
    APP_ORIGIN :getEnv("APP_ORIGIN", "http://localhost:3000"),
    APP_PORT : getEnv("PORT", "8080"),
    MONGO_URI : getEnv("MONGO_URI"),
    MAILER_SENDER: getEnv("MAILER_SENDER"),
    BASE_PATH: getEnv("BASE_PATH", "/api/v1"),
    // BASE_PATH: process.env.BASE_PATH || '/api',
    // APP_ORIGIN: process.env.APP_ORIGIN || 'http://localhost:3000'
    JWT:{
        SECRET: getEnv("JWT_SECRET"),
        EXPIRES_IN :getEnv("JWT_EXPIRY", "1h"),
        REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
        REFRESH_EXPIRES_IN :getEnv("JWT_REFRESH_EXPIRY", "1d")
    }

}
