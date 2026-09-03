import { getDB } from "../../config/db.js";
import BusinessAssetModel from "./businessAsset.model.js";
import { deleteFile } from "../../utils/fileHelper.js";

const BusinessAssetService = {
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 🔒 Check category exists
      const category = await BusinessAssetModel.findCategory(
        conn,
        data.category_id,
      );
      if (!category) {
        throw { status: 404, message: "Category not found" };
      }

      // 🔢 Generate asset_no
      const asset_no = await BusinessAssetModel.generateAssetNo(conn);

      const id = await BusinessAssetModel.create(conn, {
        ...data,
        asset_no,
        created_by: user.id,
        updated_by: user.id,
      });

      await conn.commit();

      return { message: "Asset created", id, asset_no };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll(filters) {
    const data = await BusinessAssetModel.findAll(filters);
    return { count: data.length, data };
  },

  async getById(id) {
    const asset = await BusinessAssetModel.findById(id);
    if (!asset) throw { status: 404, message: "Asset not found" };
    return asset;
  },

  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // Use transactional findByIdWithConn to lock the row
      const existing = await BusinessAssetModel.findByIdWithConn(conn, id);
      if (!existing) throw { status: 404, message: "Asset not found" };

      await BusinessAssetModel.update(conn, id, {
        ...data,
        updated_by: user.id,
      });

      await conn.commit();

      // If new image uploaded or removed, delete the old physical image file
      if (
        data.image !== undefined &&
        existing.image &&
        existing.image !== data.image
      ) {
        deleteFile(existing.image);
      }

      return { message: "Asset updated" };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateStatus(id, status, user) {
    const existing = await BusinessAssetModel.findById(id);
    if (!existing) throw { status: 404, message: "Asset not found" };

    await BusinessAssetModel.updateStatus(id, status, user.id);
    return { message: "Status updated" };
  },

  async delete(id) {
    const existing = await BusinessAssetModel.findById(id);
    if (!existing) throw { status: 404, message: "Asset not found" };

    await BusinessAssetModel.delete(id);

    if (existing.image) {
      deleteFile(existing.image);
    }

    return { message: "Asset deleted" };
  },
};

export default BusinessAssetService;

