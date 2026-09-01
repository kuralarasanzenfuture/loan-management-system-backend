import { getDB } from "../../config/db.js";
import RolePermissionModel from "./rolePermissions.model.js";

const RolePermissionService = {
  async bulkUpsert(data, user) {
    const db = getDB();
    const conn = await db.getConnection();
    let transactionStarted = false;

    try {
      const { role_id, permissions } = data;

      await conn.beginTransaction();
      transactionStarted = true;

      const isAdmin = user?.role?.trim().toUpperCase() === "ADMIN";
      const isSuperAdmin = user?.role?.trim().toUpperCase() === "SUPER_ADMIN";

      if (!isAdmin && !isSuperAdmin) {
        throw {
          status: 403,
          message: "Only ADMIN users can modify role permissions",
        };
      }

      /* =========================================
         🔥 VALIDATE TARGET ROLE
    ========================================= */

      const role = await RolePermissionModel.checkRole(conn, role_id);
      if (!role) {
        throw { status: 404, message: "Role not found" };
      }

      if (role.is_system || role.name?.trim().toUpperCase() === "ADMIN") {
        throw {
          status: 403,
          message: "ADMIN permissions cannot be modified",
        };
      }

      /* =========================================
       🔥 VALIDATE ACTIONS
    ========================================= */

      const actionIds = permissions.map((p) => p.action_id);

      const validActions = await RolePermissionModel.checkActions(
        conn,
        actionIds,
      );

      const validActionIds = new Set(validActions.map((action) => action.id));
      if (
        validActionIds.size !== actionIds.length ||
        actionIds.some((actionId) => !validActionIds.has(actionId))
      ) {
        throw { status: 400, message: "Invalid action_id(s)" };
      }

      /* =========================================
       🔥 PREPARE VALUES
    ========================================= */

      const values = permissions.map((p) => [
        role_id,
        p.action_id,
        p.is_allowed ? 1 : 0,
      ]);

      /* =========================================
       🔥 UPSERT
    ========================================= */

      await RolePermissionModel.bulkUpsert(conn, values);

      await conn.commit();

      return {
        message: "Role permissions updated successfully",
      };
    } catch (err) {
      if (transactionStarted) await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getByRole(roleId) {
    const db = getDB();
    const [[role]] = await db.query(`SELECT id FROM roles WHERE id = ?`, [
      roleId,
    ]);

    if (!role) {
      throw { status: 404, message: "Role not found" };
    }

    return await RolePermissionModel.getByRole(roleId);
  },

  async getTreeByRole(roleId) {
    const db = getDB();

    // 🔥 Validate role
    const [[role]] = await db.query(`SELECT id FROM roles WHERE id = ?`, [
      roleId,
    ]);

    if (!role) {
      throw { status: 404, message: "Role not found" };
    }

    // 🔥 Get modules
    const [modules] = await db.query(`
    SELECT id, name, code, parent_id, sort_order
    FROM modules
    WHERE is_active = 1
    ORDER BY sort_order ASC, id ASC
  `);

    // 🔥 Get actions with permission
    const [actions] = await db.query(
      `
    SELECT 
      ma.id,
      ma.module_id,
      ma.action_code,
      ma.action_name,
      COALESCE(rp.is_allowed, 0) AS is_allowed
    FROM module_actions ma
    LEFT JOIN role_permissions rp
      ON rp.action_id = ma.id AND rp.role_id = ?
    WHERE ma.is_active = 1
    ORDER BY ma.module_id ASC, ma.id ASC
  `,
      [roleId],
    );

    /* =========================================
     MAP ACTIONS → MODULE
  ========================================= */
    const actionMap = {};

    for (const a of actions) {
      if (!actionMap[a.module_id]) {
        actionMap[a.module_id] = [];
      }

      actionMap[a.module_id].push({
        id: a.id,
        code: a.action_code,
        name: a.action_name,
        is_allowed: Number(a.is_allowed),
      });
    }

    /* =========================================
     BUILD MODULE MAP
  ========================================= */
    const moduleMap = {};

    for (const m of modules) {
      moduleMap[m.id] = {
        id: m.id,
        name: m.name,
        code: m.code,
        parent_id: m.parent_id,
        actions: actionMap[m.id] || [],
        children: [],
      };
    }

    /* =========================================
     BUILD TREE
  ========================================= */
    const tree = [];

    for (const m of modules) {
      if (m.parent_id && moduleMap[m.parent_id]) {
        moduleMap[m.parent_id].children.push(moduleMap[m.id]);
      } else {
        tree.push(moduleMap[m.id]);
      }
    }

    return tree;
  },
};

export default RolePermissionService;
