import { getEnv } from "../common/utils/getenv";

export const appconfig = {
    APP_NAME: getEnv("APP_NAME", "MyApp"),
    NODE_ENV : getEnv("NODE_ENV", "development"),
    APP_ORIGIN :getEnv("APP_ORIGIN", "http://localhost:3000"),
    APP_PORT : getEnv("PORT", "8080"),
    BASE_PATH: process.env.BASE_PATH || '/api',
    // APP_ORIGIN: process.env.APP_ORIGIN || 'http://localhost:3000'
    JWT:{
        SECRET: getEnv("JWT_SECRET"),
        EXPIRES_IN :getEnv("JWT_EXPIRY", "1h"),
        REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
        REFRESH_EXPIRES_IN :getEnv("JWT_REFRESH_EXPIRY", "1d")
    }

}
