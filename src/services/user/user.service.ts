import User from "../../models/User";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

export type ServiceResponse = {
  status: number;
  user: object;
};

export const currentUserService = async (
  userId: Types.ObjectId | undefined,
): Promise<ServiceResponse> => {
  const user = await User.findById(userId);

  return {
    status: StatusCodes.OK,
    user: user || {},
  };
};
