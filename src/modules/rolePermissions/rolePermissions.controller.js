import RolePermissionService from "./rolePermissions.service.js";
import {
  bulkRolePermissionSchema,
  roleIdParamSchema,
} from "./rolePermissions.validation.js";

/* =========================================
   BULK UPSERT
========================================= */
export const setRolePermissions = async (req, res, next) => {
  try {
    const data = await bulkRolePermissionSchema.validateAsync(req.body);

    // 🔥 duplicate check (IMPORTANT)
    const ids = data.permissions.map((p) => p.action_id);
    if (new Set(ids).size !== ids.length) {
      throw { status: 400, message: "Duplicate action_id found" };
    }

    const result = await RolePermissionService.bulkUpsert(data, req.user);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================================
   GET BY ROLE
========================================= */
export const getRolePermissions = async (req, res, next) => {
  try {
    const { roleId } = await roleIdParamSchema.validateAsync(req.params);

    const data = await RolePermissionService.getByRole(roleId);

    // console.table(data);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getTreeRolePermissions = async (req, res, next) => {
  try {
    const { roleId } = await roleIdParamSchema.validateAsync(req.params);

    const data = await RolePermissionService.getTreeByRole(roleId);

    // console.table(data);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};
