import "express";
import { TokenUser } from "./user.types";

declare global {
  namespace Express {
    export interface Request {
      user?: TokenUser;
      file?: Multer.File;
      files?: {
        [fieldname: string]: Multer.File[];
      };
    }
  }
}
