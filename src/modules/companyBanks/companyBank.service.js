import { getDB } from "../../config/db.js";
import CompanyBankModel from "./companyBank.model.js";

const CompanyBankService = {
  async create(data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 🔍 Auto-populate company_id from company_details if not provided
      if (!data.company_id) {
        const [[company]] = await conn.query(
          `SELECT id FROM company_details LIMIT 1`,
        );
        if (company) {
          data.company_id = company.id;
        } else {
          throw {
            status: 400,
            message:
              "Company details record not found. Please create company details first.",
          };
        }
      }

      // ❌ duplicate account check
      const exists = await CompanyBankModel.findByAccount(
        conn,
        data.company_id,
        data.account_number,
      );

      if (exists) {
        throw {
          status: 400,
          message: "Account number already exists for this company",
        };
      }

      // 🔥 only ONE primary account
      if (data.is_primary) {
        await CompanyBankModel.resetPrimary(conn, data.company_id);
      }

      const id = await CompanyBankModel.create(conn, {
        ...data,
        created_by: user.id,
      });

      await conn.commit();

      const createdBank = await CompanyBankModel.findById(conn, id);

      return {
        message: "Bank account added successfully",
        data: createdBank,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll(query = {}) {
    const data = await CompanyBankModel.findAll(query);

    return {
      message: "Company banks fetched successfully",
      data,
    };
  },

  async getById(id) {
    const bank = await CompanyBankModel.findById(null, id);

    if (!bank) {
      throw { status: 404, message: "Bank account not found" };
    }

    return {
      message: "Company bank fetched successfully",
      data: bank,
    };
  },

  async update(id, data, user) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await CompanyBankModel.findById(conn, id);

      if (!existing) {
        throw { status: 404, message: "Bank account not found" };
      }

      let companyId = data.company_id || existing.company_id;

      if (!companyId) {
        const [[company]] = await conn.query(
          `SELECT id FROM company_details LIMIT 1`,
        );
        if (company) {
          companyId = company.id;
          data.company_id = company.id;
        }
      }

      const accountNumber = data.account_number || existing.account_number;

      // Duplicate check if company_id or account_number changed
      const exists = await CompanyBankModel.findByAccount(
        conn,
        companyId,
        accountNumber,
        id,
      );

      if (exists) {
        throw {
          status: 400,
          message: "Account number already exists for this company",
        };
      }

      if (data.is_primary) {
        await CompanyBankModel.resetPrimary(conn, companyId);
      }

      await CompanyBankModel.update(conn, id, {
        ...data,
        updated_by: user.id,
      });

      await conn.commit();

      const updatedBank = await CompanyBankModel.findById(null, id);

      return {
        message: "Bank account updated successfully",
        data: updatedBank,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const existing = await CompanyBankModel.findById(null, id);

    if (!existing) {
      throw { status: 404, message: "Bank account not found" };
    }

    if (existing.is_primary) {
      throw {
        status: 400,
        message:
          "Cannot delete primary bank account. Set another account as primary first.",
      };
    }

    await CompanyBankModel.delete(id);

    return { message: "Bank account deleted successfully" };
  },

  async setPrimaryBank(id) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const existing = await CompanyBankModel.findById(conn, id);

      if (!existing) {
        throw { status: 404, message: "Bank account not found" };
      }

      await CompanyBankModel.setPrimary(conn, id, existing.company_id);

      await conn.commit();

      const updatedBank = await CompanyBankModel.findById(null, id);

      return {
        message: "Primary bank account set successfully",
        data: updatedBank,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

export default CompanyBankService;
