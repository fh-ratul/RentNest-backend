import { CookieOptions, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { authService } from "./auth.service.js";

const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hour or 1 day
const REFRESH_TOKEN_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 day

const cookieOptions = (maxAge: number): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge,
  };
};

const setAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie("accessToken", accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
};

const setAuthCookies = (
  res: Response,
  { accessToken, refreshToken }: { accessToken: string; refreshToken: string },
) => {
  setAccessTokenCookie(res, accessToken);
  res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE));
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message:
      "User registered successfully. An OTP has been sent to your email, it is valid for 1 minute.",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyEmail(req.body);
  setAuthCookies(res, result);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Email verified successfully",
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.resendOtp(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "A new OTP has been sent to your email, it is valid for 1 minute.",
    data: result,
  });
});

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const { accessToken, refreshToken } = await authService.loginUser(payload);
    setAuthCookies(res, { accessToken, refreshToken });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User logged in successfully",
      data: { accessToken, refreshToken },
    });
  },
);

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.googleLogin(req.body);
  setAuthCookies(res, result);

  sendResponse(res, {
    success: true,
    statusCode: result.isNewUser ? httpStatus.CREATED : httpStatus.OK,
    message: result.isNewUser
      ? "User signed up with Google successfully"
      : "User logged in with Google successfully",
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.user!.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile retrieved",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const { accessToken } = await authService.refreshToken(token);

  setAccessTokenCookie(res, accessToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Access token refreshed",
    data: { accessToken },
  });
});

export const authController = {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
  googleLogin,
  getMe,
  refreshToken,
};
