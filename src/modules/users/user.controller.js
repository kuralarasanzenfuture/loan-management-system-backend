import { errorHandler } from "../../middlewares/error.middleware.js";
import { UserService } from "./user.service.js";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema,
  changePasswordSchema,
} from "./user.validation.js";

const ACCESS_EXP = "15m";
const REFRESH_EXP_DAYS = 7;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false, // 🔴 true in production (HTTPS)
};

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

    const refresh_token =
      body.refresh_token || body.refreshToken || cookies.refresh_token;
    const session_id = body.session_id || body.sessionId || cookies.session_id;

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
    const user = await UserService.getProfile(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserService.getAll();
    res.json(users);
  } catch (e) {
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = await userIdParamSchema.validateAsync(req.params);
    const user = await UserService.getById(id);
    res.json(user);
  } catch (e) {
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = await userIdParamSchema.validateAsync(req.params);
    const data = await updateUserSchema.validateAsync(req.body);
    const user = await UserService.update(id, data);
    res.json(user);
  } catch (e) {
    next(e);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = await userIdParamSchema.validateAsync(req.params);
    const { status } = await updateUserStatusSchema.validateAsync(req.body);
    const result = await UserService.update(id, { status });
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const changeOwnPassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = await changePasswordSchema.validateAsync(req.body);
    const result = await UserService.changeOwnPassword(req.user.id, current_password, new_password);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = await userIdParamSchema.validateAsync(req.params);
    const result = await UserService.delete(id);
    res.json(result);
  } catch (e) {
    next(e);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const session_id =
      req.cookies?.session_id ||
      req.body?.session_id ||
      req.body?.sessionId ||
      req.user?.session_id;

    const result = await UserService.logout(req.user.id, session_id);

    res.clearCookie("access_token", cookieOptions);
    res.clearCookie("refresh_token", cookieOptions);
    res.clearCookie("session_id", cookieOptions);

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

    res.clearCookie("access_token", cookieOptions);
    res.clearCookie("refresh_token", cookieOptions);
    res.clearCookie("session_id", cookieOptions);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const checkUsername = async (req, res, next) => {
  try {
    const result = await UserService.checkUsername(req.params.username);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const checkEmail = async (req, res, next) => {
  try {
    const result = await UserService.checkEmail(req.params.email);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

export const checkMobile = async (req, res, next) => {
  try {
    const result = await UserService.checkMobile(req.params.mobile);

    res.json({
      success: true,
      ...result,
    });
  } catch (e) {
    next(e);
  }
};
