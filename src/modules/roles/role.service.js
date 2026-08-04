import { RoleModel } from "./role.model.js";

export const RoleService = {
  async createRole(data) {
    const existing = await RoleModel.findByName(data.name);

    if (existing) {
      throw { status: 400, message: "Role already exists" };
    }

    const id = await RoleModel.create(data);
    return { id, ...data };
  },

  async getAllRoles() {
    return await RoleModel.getAll();
  },

  async updateRole(id, data) {
    const role = await RoleModel.findById(id);

    if (!role) {
      throw { status: 404, message: "Role not found" };
    }

    if (role.is_system) {
      throw { status: 403, message: "System role cannot be modified" };
    }

    if (data.name) {
      const existing = await RoleModel.findByName(data.name);
      if (existing && existing.id !== id) {
        throw { status: 400, message: "Role name already exists" };
      }
    }

    await RoleModel.update(id, data);

    return { message: "Role updated" };
  },

  async deleteRole(id) {
    const role = await RoleModel.findById(id);

    if (!role) {
      throw { status: 404, message: "Role not found" };
    }

    if (role.is_system) {
      throw { status: 403, message: "System role cannot be deleted" };
    }

    const assigned = await RoleModel.isRoleAssigned(id);

    if (assigned) {
      throw {
        status: 400,
        message: "Role is assigned to users. Cannot delete",
      };
    }

    await RoleModel.delete(id);

    return { message: "Role deleted" };
  },
};
