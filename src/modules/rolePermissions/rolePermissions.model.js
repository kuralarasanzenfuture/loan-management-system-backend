import { getDB } from "../../config/db.js";

const RolePermissionModel = {
  /* =========================================
     CHECK ROLE
  ========================================= */
  async checkRole(conn, role_id) {
    const [[row]] = await conn.query(
      `SELECT id, name, is_system FROM roles WHERE id = ?`,
      [role_id],
    );
    return row;
  },

  /* =========================================
     CHECK ACTIONS
  ========================================= */
  async checkActions(conn, actionIds) {
    if (!actionIds.length) return [];

    const [rows] = await conn.query(
      `SELECT id FROM module_actions WHERE id IN (?)`,
      [actionIds],
    );

    return rows;
  },

  /* =========================================
     BULK UPSERT
  ========================================= */
  async bulkUpsert(conn, values) {
    await conn.query(
      `
      INSERT INTO role_permissions (role_id, action_id, is_allowed)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        is_allowed = VALUES(is_allowed),
        updated_at = CURRENT_TIMESTAMP
      `,
      [values],
    );
  },

  /* =========================================
     GET BY ROLE (UI READY)
  ========================================= */
  async getByRole(roleId) {
    const db = getDB();

    const [rows] = await db.query(
      `
      SELECT 
        m.id AS module_id,
        m.name AS module_name,
        m.code AS module_code,

        ma.id AS action_id,
        ma.action_code,
        ma.action_name,

        COALESCE(rp.is_allowed, 0) AS is_allowed

      FROM modules m
      LEFT JOIN module_actions ma 
        ON ma.module_id = m.id AND ma.is_active = 1

      LEFT JOIN role_permissions rp 
        ON rp.action_id = ma.id 
        AND rp.role_id = ?

      WHERE m.is_active = 1

      ORDER BY m.sort_order ASC, ma.id ASC
      `,
      [roleId],
    );

    return rows;
  },

  

};

export default RolePermissionModel;
