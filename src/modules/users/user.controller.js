import { errorHandler } from "../../middlewares/error.middleware.js";
import { UserService } from "./user.service.js";
import { registerSchema, loginSchema } from "./user.validation.js";

const ACCESS_EXP = "15m";
const REFRESH_EXP_DAYS = 7;

export const createUser = async (req, res, next) => {
  try {
    const data = await registerSchema.validateAsync(req.body);
    const result = await UserService.register(data);
    res.status(201).json(result);
  } catch (e) {
    // next(e);
    errorHandler(e, req, res, next);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const data = await loginSchema.validateAsync(req.body);

    const result = await UserService.login(data, req);

    const isProd = process.env.NODE_ENV === "production";

    // 🍪 ACCESS TOKEN
    res.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 min
    });

    // 🍪 REFRESH TOKEN
    res.cookie("refresh_token", result.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: REFRESH_EXP_DAYS * 24 * 60 * 60 * 1000,
    });

    // 🍪 SESSION ID
    res.cookie("session_id", result.session_id, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });

    // 🔥 RESPONSE (also send tokens for mobile/API use)
    res.json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    console.log("COOKIES:", req.cookies);
    console.log("BODY:", req.body);

    // 🔥 accept from BOTH places
    // const refresh_token = req.body?.refresh_token || req.cookies?.refresh_token;

    // const session_id = req.body?.session_id || req.cookies?.session_id;
    /*------------------------- or ---------------------------------------------*/
    const body = req.body || {};
    const cookies = req.cookies || {};

    const refresh_token = body.refresh_token || cookies.refresh_token;
    const session_id = body.session_id || cookies.session_id;

    if (!refresh_token || !session_id) {
      throw { status: 400, message: "Missing token or session" };
    }

    const result = await UserService.refreshToken({
      refresh_token,
      session_id,
    });

    // 🍪 update cookies
    res.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", result.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: REFRESH_EXP_DAYS * 24 * 60 * 60 * 1000,
    });

    res.cookie("session_id", result.session_id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (e) {
    next(e);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const session_id = req.cookies?.session_id;

    const result = await UserService.logout(req.user.id, session_id);

    // 🍪 clear cookies
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("session_id");

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const logoutAllDevices = async (req, res, next) => {
  try {
    const result = await UserService.logoutAll(req.user.id);

    // 🍪 clear cookies (current device too)
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("session_id");

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
