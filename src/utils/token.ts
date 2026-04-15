import Jwt from "jsonwebtoken";
import { IUser } from "../models/User";

export const GenerateToken = (user: IUser) => {
  return Jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.UserType,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
    }
  );
};
