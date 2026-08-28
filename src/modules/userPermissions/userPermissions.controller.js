import UserPermissionService from "./userPermissions.service.js";
import {
  bulkUserPermissionSchema,
  userIdParamSchema,
} from "./userPermissions.validation.js";

/* =========================================
   BULK UPSERT
========================================= */
export const setUserPermissions = async (req, res, next) => {
  try {
    const data = await bulkUserPermissionSchema.validateAsync(req.body);

    // 🔥 duplicate protection
    const ids = data.permissions.map((p) => p.action_id);
    if (new Set(ids).size !== ids.length) {
      throw { status: 400, message: "Duplicate action_id found" };
    }

    const result = await UserPermissionService.bulkUpsert(data, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   GET FLAT
========================================= */
export const getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = await userIdParamSchema.validateAsync(req.params);

    const data = await UserPermissionService.getByUser(userId);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   GET TREE
========================================= */
export const getTreeUserPermissions = async (req, res, next) => {
  try {
    const { userId } = await userIdParamSchema.validateAsync(req.params);

    const data = await UserPermissionService.getTreeByUser(userId);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};
