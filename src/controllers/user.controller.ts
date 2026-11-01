import { Request, Response } from "express";
import * as userService from "../services/user/user.service";

export const getCurrentUser = async (req: Request, res: Response) => {
  const result = await userService.currentUserService(req.user?._id);

  res.status(result.status).json({ user: result.user });
};
