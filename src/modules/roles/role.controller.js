import { RoleService } from "./role.service.js";
import { createRoleSchema, updateRoleSchema } from "./role.validation.js";

export const createRole = async (req, res, next) => {
  try {
    const data = await createRoleSchema.validateAsync(req.body);
    const result = await RoleService.createRole(data);

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    const roles = await RoleService.getAllRoles();
    res.json(roles);
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const data = await updateRoleSchema.validateAsync(req.body);
    const result = await RoleService.updateRole(req.params.id, data);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const result = await RoleService.deleteRole(req.params.id);

    res.json(result);
  } catch (err) {
    next(err);
  }
};
