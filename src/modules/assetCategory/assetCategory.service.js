import { getDB } from "../../config/db.js";
import AssetCategoryModel from "./assetCategory.model.js";

const AssetCategoryService = {
  async create(data) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // ❌ prevent duplicate
      const existing = await AssetCategoryModel.findByName(
        conn,
        data.category_name,
      );

      if (existing) {
        throw { status: 400, message: "Category already exists" };
      }

      const id = await AssetCategoryModel.create(conn, data);

      await conn.commit();

      return { message: "Category created", id };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll(query) {
    const data = await AssetCategoryModel.findAll(query);

    return {
      count: data.length,
      data,
    };
  },

  async getById(id) {
    const category = await AssetCategoryModel.findById(null, id);

    if (!category) {
      throw { status: 404, message: "Category not found" };
    }

    return category;
  },

  async update(id, data) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await AssetCategoryModel.findById(conn, id);

      if (!existing) {
        throw { status: 404, message: "Category not found" };
      }

      if (data.category_name) {
        const dup = await AssetCategoryModel.findByName(
          conn,
          data.category_name,
        );

        if (dup && dup.id !== Number(id)) {
          throw { status: 400, message: "Category name already exists" };
        }
      }

      await AssetCategoryModel.update(conn, id, {
        category_name: data.category_name ?? existing.category_name,
        description: data.description ?? existing.description,
        status: data.status ?? existing.status,
      });

      await conn.commit();

      return { message: "Category updated" };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const existing = await AssetCategoryModel.findById(null, id);

    if (!existing) {
      throw { status: 404, message: "Category not found" };
    }

    await AssetCategoryModel.delete(id);

    return { message: "Category deleted" };
  },
};

export default AssetCategoryService;
