import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const validate =
  (schema: z.ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };

export default validate;
