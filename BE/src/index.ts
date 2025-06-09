import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { appconfig } from "./config/app.config";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middleware/asyncHandlerr";
import main from "./database/database";
import { errorHandler } from "./middleware/errorhandler";
import { BadRequest } from "./common/utils/catch-errors";
import { authcontroller } from "./modules/auth/auth.module";
import authroute from "./modules/auth/auth.routes";



const app = express();
const BASE_PATH = appconfig.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: appconfig.APP_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());


app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequest("bad request");
    res.status(HTTPSTATUS.OK).json({
      message: "is it working?? hmmm ok..",
    });
  })
);

app.use(`${BASE_PATH}/auth`,authroute)
app.use(errorHandler);
app.listen(appconfig.APP_PORT, async () => {
  console.log(`Server listening on port ${appconfig.APP_PORT} in ${appconfig.NODE_ENV}`);
  await main();
});
