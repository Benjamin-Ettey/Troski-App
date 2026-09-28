import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";

// Define custom interfaces for the expected Mongoose/MongoDB error shapes
interface MongooseError extends Error {
  name: string;
  statusCode?: number;
  code?: number;
  value?: string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

// Ensure the function includes NextFunction to maintain Express's 4-argument contract
const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Cast the unknown error to our structured MongooseError type for internal processing
  const error = err as MongooseError;

  const customError = {
    statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: error.message || "Something went wrong try again later",
  };

  // Handle Mongoose Validation Errors (e.g., missing required fields)
  if (error.name === "ValidationError" && error.errors) {
    customError.msg = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle MongoDB Duplicate Key Errors (code 11000).
  // Several unique indexes are compound (e.g. { email, role }, { phoneNumber, role }),
  // so map the offending field(s) to a clear, user-facing message.
  if (error.code === 11000 && error.keyValue) {
    const keys = Object.keys(error.keyValue);
    const friendlyMessages: Record<string, string> = {
      email: "An account with this email already exists",
      phoneNumber: "An account with this phone number already exists",
      adminId: "This admin ID is already taken",
      googleId: "This Google account is already linked to another user",
      plateNumber: "A vehicle with this plate number already exists",
    };

    const matched = keys.find((key) => key in friendlyMessages);
    customError.msg = matched
      ? friendlyMessages[matched]
      : `Duplicate value entered for [${keys.join(", ")}], please choose another value`;
    customError.statusCode = StatusCodes.CONFLICT;
  }

  // Handle Mongoose Cast Errors (e.g., malformed MongoDB ObjectIDs)
  if (error.name === "CastError") {
    customError.msg = `No item found with id : ${error.value || "unknown"}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

export default errorHandlerMiddleware;
