import { getDB } from "../../config/db.js";
import { getImageUrl } from "../../utils/imageUrl.js";

const BusinessAssetModel = {
  //   async generateAssetNo(conn) {
  //     const [[row]] = await conn.query(
  //       `SELECT asset_no FROM business_assets
  //        ORDER BY id DESC LIMIT 1`,
  //     );

  //     let next = 1;

  //     if (row?.asset_no) {
  //       next = Number(row.asset_no.split("-")[1]) + 1;
  //     }

  //     return `AST-${String(next).padStart(5, "0")}`;
  //   },

  /**
   * Generates an asset number in the format: AST-[CATEGORY_CODE]-[YEAR]-[SEQUENCE]
   * Example output: AST-IT-2026-001
   *
   * @param {Object} conn - MySQL connection or pool transaction
   * @param {string} categoryCode - Category short code (e.g., 'IT', 'FUR', 'VEH', 'ELC', 'GEN')
   * @returns {Promise<string>} - Formatted asset number
   */
  async generateAssetNo(conn, categoryCode = "GEN") {
    const currentYear = new Date().getFullYear();
    const prefix = `AST-${categoryCode.toUpperCase()}-${currentYear}-`;

    // Fetch the latest asset number matching the same category prefix and year
    const [[row]] = await conn.query(
      `SELECT asset_no FROM business_assets 
     WHERE asset_no LIKE ? 
     ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`],
    );

    let nextSequence = 1;

    if (row?.asset_no) {
      // Extract the sequence number from the end of AST-CAT-YEAR-001
      const parts = row.asset_no.split("-");
      const lastSeq = parseInt(parts[parts.length - 1], 10);

      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    // Pads sequence to 3 digits (e.g., 1 -> 001)
    return `${prefix}${String(nextSequence).padStart(3, "0")}`;
  },

  async findCategory(conn, id) {
    const [[row]] = await conn.query(
      `SELECT id FROM asset_categories WHERE id=?`,
      [id],
    );
    return row;
  },

  //   async create(conn, data) {
  //     const [result] = await conn.query(
  //       `INSERT INTO business_assets (
  //         asset_no, category_id, asset_name,
  //         brand, model, serial_number, description,
  //         purchase_price, purchase_date, vendor_name, invoice_number,
  //         current_value, image, location,
  //         condition_status, status, remarks,
  //         created_by, updated_by
  //       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  //       [
  //         data.asset_no,
  //         data.category_id,
  //         data.asset_name,
  //         data.brand,
  //         data.model,
  //         data.serial_number,
  //         data.description,
  //         data.purchase_price,
  //         data.purchase_date,
  //         data.vendor_name,
  //         data.invoice_number,
  //         data.current_value,
  //         data.image,
  //         data.location,
  //         data.condition_status,
  //         data.status,
  //         data.remarks,
  //         data.created_by,
  //         data.updated_by,
  //       ],
  //     );

  //     return result.insertId;
  //   },

  async create(conn, data) {
    const [result] = await conn.query(
      `INSERT INTO business_assets (
        asset_no, category_id, asset_name,
        brand, model, serial_number, description,
        purchase_price, purchase_date, quantity, vendor_name, invoice_number,
        image, location,
        condition_status, status, remarks,
        created_by, updated_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.asset_no,
        data.category_id,
        data.asset_name,
        data.brand,
        data.model,
        data.serial_number,
        data.description,
        data.purchase_price,
        data.purchase_date,
        data.quantity,
        data.vendor_name,
        data.invoice_number,
        data.image,
        data.location,
        data.condition_status,
        data.status,
        data.remarks,
        data.created_by,
        data.updated_by,
      ],
    );

    return result.insertId;
  },

  async findAll(filters = {}) {
    const db = getDB();

    let query = `SELECT * FROM business_assets WHERE 1=1`;
    const params = [];

    if (filters.category_id) {
      query += ` AND category_id=?`;
      params.push(filters.category_id);
    }

    if (filters.status) {
      query += ` AND status=?`;
      params.push(filters.status);
    }

    query += ` ORDER BY id DESC`;

    const [rows] = await db.query(query, params);
    // return rows;
    // 🔥 Transform image path → full URL
    return rows.map((row) => ({
      ...row,
      image: getImageUrl(row.image),
    }));
  },

  async findById(id) {
    const db = getDB();
    const [[row]] = await db.query(`SELECT * FROM business_assets WHERE id=?`, [
      id,
    ]);
    // return row;
    return {
      ...row,
      image: getImageUrl(row.image),
    };
  },

  async findByIdWithConn(conn, id) {
    const [[row]] = await conn.query(
      `SELECT * FROM business_assets WHERE id=?`,
      [id],
    );
    return row;
  },

  async update(conn, id, data) {
    await conn.query(`UPDATE business_assets SET ? WHERE id=?`, [data, id]);
  },

  async updateStatus(id, status, userId) {
    const db = getDB();
    await db.query(
      `UPDATE business_assets SET status=?, updated_by=? WHERE id=?`,
      [status, userId, id],
    );
  },

  async delete(id) {
    const db = getDB();
    await db.query(`DELETE FROM business_assets WHERE id=?`, [id]);
  },
};

export default BusinessAssetModel;
