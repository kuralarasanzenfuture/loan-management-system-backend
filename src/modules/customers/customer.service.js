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

function sanitizeCustomerData(data) {
  const sanitized = { ...data };
  if (sanitized.dob === "") sanitized.dob = null;
  if (sanitized.gender === "") sanitized.gender = null;
  if (sanitized.aadhaar_no === "") sanitized.aadhaar_no = null;
  if (sanitized.pan_no === "") sanitized.pan_no = null;
  if (sanitized.alternate_mobile === "") sanitized.alternate_mobile = null;
  if (sanitized.reference_mobile === "") sanitized.reference_mobile = null;
  if (sanitized.pincode === "") sanitized.pincode = null;
  if (sanitized.status === "") sanitized.status = "active";

  if (
    sanitized.monthly_income === "" ||
    sanitized.monthly_income === null ||
    sanitized.monthly_income === undefined ||
    isNaN(Number(sanitized.monthly_income))
  ) {
    sanitized.monthly_income = 0;
  } else {
    sanitized.monthly_income = Number(sanitized.monthly_income);
  }

  return sanitized;
}

export const CustomerService = {
  async create(data, user, files = {}) {
    const db = getDB();
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const customer_no = await generateCustomerNo(conn);
      const cleanData = sanitizeCustomerData(data);

      // 🔹 1. Insert customer (delegated to model)
      const photoFile = files.photo?.[0];
      const customer_id = await CustomerModel.create(conn, {
        ...cleanData,
        customer_no,
        created_by: user.id,
        photo: photoFile
          ? `uploads/customers/photo/${photoFile.filename}`
          : null,
      });

      // 🔹 2. Insert documents (delegated to document service)
      const docsUploaded = await CustomerDocumentService.insertDocuments(
        conn,
        customer_id,
        files,
        data,
      );

      await conn.commit();

      const newCustomer = await this.getById(customer_id);

      return {
        message: "Customer created successfully",
        id: customer_id,
        customer_no,
        documents_uploaded: docsUploaded,
        data: newCustomer,
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
    console.log("Updating customer with ID:", id);
    // console.log("Data received for update:", data);
    console.log("Files received for update:", files);
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

      const cleanData = sanitizeCustomerData(data);

      // 🔹 1. Update customer fields
      if (files.photo?.[0]?.filename) {
        cleanData.photo = `uploads/customers/photo/${files.photo[0].filename}`;
      }
      await CustomerModel.update(conn, id, cleanData);

      // 🔹 2. Insert new documents if any (excluding "photo" which is handled above)
      let docsUploaded = 0;
      const hasDocFiles =
        files &&
        Object.keys(files).some(
          (key) => !["photo"].includes(key),
        );

      if (hasDocFiles) {
        docsUploaded = await CustomerDocumentService.insertDocuments(
          conn,
          id,
          files,
          data,
        );
      }

      await conn.commit();

      const updatedCustomer = await this.getById(id);

      return {
        message: "Customer updated",
        documents_uploaded: docsUploaded,
        data: updatedCustomer,
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
