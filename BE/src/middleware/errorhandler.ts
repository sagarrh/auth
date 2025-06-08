import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../common/utils/AppError";
import { ErrorCode } from "../common/enums/error-codes.enums";

// Correct spelling and parameter order
export const errorHandler: ErrorRequestHandler = (error, req, res, next):any => {
    console.error(`Error on PATH: ${req.path}`, error);

    if (error instanceof SyntaxError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "invalid json format please check the message request",
        });
    }

    if(error instanceof AppError){
        return res.status(error.statusCode).json({
            message:error.message,
            ErrorCode:error.errorCode
        })
    }

    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error?.message || "Unknown error occurred",
    });
};
