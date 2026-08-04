import { CustomerModel } from "./customer.model.js";
import { CustomerDocumentService } from "./customer.document.service.js";
import { getDB } from "../../config/db.js";

async function generateCustomerNo(conn) {
  const year = new Date().getFullYear();

  // 🔒 lock last record of this year
  const [rows] = await conn.query(
    `
    SELECT customer_no 
    FROM customers
    WHERE customer_no LIKE ?
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
    `,
    [`CUS-${year}-%`],
  );

  let nextNumber = 1;

  if (rows.length > 0) {
    const lastNo = rows[0].customer_no; // CUS-2026-000123

    const lastSeq = parseInt(lastNo.split("-")[2], 10);

    nextNumber = lastSeq + 1;
  }

  const formatted = String(nextNumber).padStart(6, "0");

  return `CUS-${year}-${formatted}`;
}

export const CustomerService = {
  async create(data, user, files = {}) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const customer_no = await generateCustomerNo(conn);

      // const [result] = await conn.query(
      //   `
      // INSERT INTO customers (
      //   customer_no,
      //   first_name,
      //   last_name,
      //   father_name,
      //   mother_name,
      //   mobile,
      //   alternate_mobile,
      //   aadhaar_no,
      //   pan_no,
      //   dob,
      //   gender,
      //   occupation,
      //   monthly_income,
      //   address,
      //   city,
      //   district,
      //   state,
      //   pincode,
      //   photo,
      //   reference_name,
      //   reference_mobile,
      //   remarks,
      //   created_by
      // ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      // `,
      //   [
      //     customer_no,
      //     data.first_name,
      //     data.last_name,
      //     data.father_name,
      //     data.mother_name,
      //     data.mobile,
      //     data.alternate_mobile,
      //     data.aadhaar_no,
      //     data.pan_no,
      //     data.dob,
      //     data.gender,
      //     data.occupation,
      //     data.monthly_income,
      //     data.address,
      //     data.city,
      //     data.district,
      //     data.state,
      //     data.pincode,
      //     files.photo?.[0]?.filename || null,
      //     data.reference_name,
      //     data.reference_mobile,
      //     data.remarks,
      //     user.id,
      //   ],
      // );

      // const customer_id = result.insertId;

      // 🔹 1. Insert customer (delegated to model)
      const customer_id = await CustomerModel.create(conn, {
        ...data,
        customer_no,
        created_by: user.id,
        photo: files.photo?.[0]?.filename || null,
      });

      // 🔹 2. Insert documents (delegated to document service)
      const docsUploaded = await CustomerDocumentService.insertDocuments(
        conn,
        customer_id,
        files,
      );

      await conn.commit();

      return {
        message: "Customer created successfully",
        id: customer_id,
        customer_no,
        documents_uploaded: docsUploaded,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getAll() {
    return await CustomerModel.findAll();
  },

  async getById(id) {
    const customer = await CustomerModel.findById(id);

    if (!customer)
      throw {
        status: 404,
        message: "Customer not found",
      };

    // 🔹 Attach documents
    const documents = await CustomerDocumentService.getByCustomerId(id);

    return { ...customer, documents };
  },

  async update(id, data, files = {}) {
    const customer = await CustomerModel.findById(id);

    if (!customer)
      throw {
        status: 404,
        message: "Customer not found",
      };

    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 🔹 1. Update customer fields
      if (files.photo?.[0]?.filename) {
        data.photo = files.photo[0].filename;
      }
      await CustomerModel.update(conn, id, data);

      // 🔹 2. Insert new documents if any
      let docsUploaded = 0;
      if (files && Object.keys(files).length > 0) {
        docsUploaded = await CustomerDocumentService.insertDocuments(
          conn,
          id,
          files,
        );
      }

      await conn.commit();

      return {
        message: "Customer updated",
        documents_uploaded: docsUploaded,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const customer = await CustomerModel.findById(id);

    if (!customer)
      throw {
        status: 404,
        message: "Customer not found",
      };

    await CustomerModel.remove(id);

    return {
      message: "Customer deleted",
    };
  },
};
