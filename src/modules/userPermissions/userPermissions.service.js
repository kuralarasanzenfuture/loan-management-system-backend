import { getDB } from "../../config/db.js";
import UserPermissionModel from "./userPermissions.model.js";

const UserPermissionService = {
  /* =========================================
     BULK UPSERT (USER LEVEL)
  ========================================= */
  async bulkUpsert(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      const { user_id, permissions } = data;

      await conn.beginTransaction();

      // 🔥 validate user
      const targetUser = await UserPermissionModel.checkUser(conn, user_id);
      if (!targetUser) {
        throw { status: 404, message: "User not found" };
      }

      // 🔥 validate actions
      const actionIds = permissions.map((p) => p.action_id);
      const validActions = await UserPermissionModel.checkActions(
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

      // 🔥 prepare values
      const values = permissions.map((p) => [
        user_id,
        p.action_id,
        p.is_allowed ? 1 : 0,
      ]);

      await UserPermissionModel.bulkUpsert(conn, values);

      await conn.commit();

      return {
        message: "User permissions updated successfully",
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /* =========================================
     GET FLAT PERMISSIONS (WITH ROLE + USER OVERRIDE)
  ========================================= */
  async getByUser(userId) {
    const db = getDB();

    // 🔥 validate user
    const [[user]] = await db.query(
      `SELECT id, role_id FROM users WHERE id = ?`,
      [userId],
    );

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    return await UserPermissionModel.getByUser(userId, user.role_id);
  },

  /* =========================================
     TREE (ROLE + USER OVERRIDE)
  ========================================= */
  async getTreeByUser(userId) {
    const db = getDB();

    // 🔥 validate user
    const [[user]] = await db.query(
      `SELECT id, role_id FROM users WHERE id = ?`,
      [userId],
    );

    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const [modules] = await db.query(`
      SELECT id, name, code, parent_id, sort_order
      FROM modules
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `);

    const [actions] = await db.query(
      `
      SELECT 
        ma.id,
        ma.module_id,
        ma.action_code,
        ma.action_name,

        -- 🔥 PRIORITY: user > role > default
        COALESCE(up.is_allowed, rp.is_allowed, 0) AS is_allowed

      FROM module_actions ma

      LEFT JOIN role_permissions rp 
        ON rp.action_id = ma.id AND rp.role_id = ?

      LEFT JOIN user_permissions up 
        ON up.action_id = ma.id AND up.user_id = ?

      WHERE ma.is_active = 1
      ORDER BY ma.module_id ASC, ma.id ASC
      `,
      [user.role_id, userId],
    );

    /* 🔥 map actions */
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

    /* 🔥 build module map */
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

    /* 🔥 build tree */
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

export default UserPermissionService;
