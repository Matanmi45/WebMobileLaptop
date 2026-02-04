import jwt from "jsonwebtoken";
import {Response} from "express"


const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
export const generateToken  = (res: Response, user: any, message: string) => {
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: "1d",
    algorithm: "HS256",
  });

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .json({
      success: true,
      message,
      user,
    });
};
