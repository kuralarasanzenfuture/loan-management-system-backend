import { getDB } from "../../config/db.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import { deleteFile } from "../../utils/fileHelper.js";

// Fields that are NOT customer documents (handled separately)
const NON_DOCUMENT_FIELDS = ["photo"];

export const CustomerDocumentService = {
  /**
   * Insert document records for a customer inside an existing transaction.
   * If replacing an existing document of the same type, deletes the old physical file.
   * @param {object} conn  - active DB connection (transaction)
   * @param {number} customerId
   * @param {object} files - req.files from multer
   * @param {object} [body] - req.body (for document_number mapping)
   */
  async insertDocuments(conn, customerId, files = {}, body = {}) {
    if (!files || Object.keys(files).length === 0) return 0;

    let count = 0;

    for (const fieldName of Object.keys(files)) {
      // 🔥 Skip non-document fields (e.g. "photo" is stored in customers table)
      if (NON_DOCUMENT_FIELDS.includes(fieldName)) continue;

      const fileArray = files[fieldName];
      if (!Array.isArray(fileArray) || fileArray.length === 0) continue;

      for (const file of fileArray) {
        // 🔥 Store relative path: uploads/customers/<fieldName>/<file.filename>
        const relativePath = `uploads/customers/${fieldName}/${file.filename}`;

        // 🔥 document_number may be sent in the body keyed by document type
        const documentNumber = body[`${fieldName}_number`] || null;

        // Check if an existing document of this type already exists for the customer
        const [[existingDoc]] = await conn.query(
          `
          SELECT id, file_name 
          FROM customer_documents 
          WHERE customer_id = ? AND document_type = ?
          LIMIT 1
          `,
          [customerId, fieldName],
        );

        await conn.query(
          `
          INSERT INTO customer_documents (
            customer_id,
            document_type,
            document_number,
            file_name
          ) VALUES (?,?,?,?)
          ON DUPLICATE KEY UPDATE
            document_number = ?,
            file_name = ?,
            uploaded_at = CURRENT_TIMESTAMP
          `,
          [
            customerId,
            fieldName,
            documentNumber,
            relativePath,
            documentNumber,
            relativePath,
          ],
        );

        // 🔥 If updating an existing document, delete the old physical file from disk
        if (existingDoc && existingDoc.file_name && existingDoc.file_name !== relativePath) {
          deleteFile(existingDoc.file_name);
        }

        count++;
      }
    }

    return count;
  },

  /**
   * Get all documents for a customer with transformed public URLs.
   */
  async getByCustomerId(customerId) {
    const db = getDB();

    const [rows] = await db.query(
      `
    SELECT id, customer_id, document_type, document_number, file_name, verified, uploaded_at
    FROM customer_documents
    WHERE customer_id = ?
    ORDER BY uploaded_at DESC
    `,
      [customerId],
    );

    return rows.map((doc) => ({
      ...doc,
      file_name: getImageUrl(doc.file_name),
    }));
  },

  /**
   * Get all documents for a customer with raw stored file paths.
   */
  async getRawByCustomerId(customerId, conn) {
    const db = conn || getDB();

    const [rows] = await db.query(
      `
      SELECT id, customer_id, document_type, document_number, file_name, verified, uploaded_at
      FROM customer_documents
      WHERE customer_id = ?
      `,
      [customerId],
    );

    return rows;
  },

  /**
   * Get a single document by id with full URL.
   */
  async getById(id) {
    const db = getDB();

    const [[row]] = await db.query(
      `
      SELECT id, customer_id, document_type, document_number, file_name, verified, uploaded_at
      FROM customer_documents
      WHERE id = ?
      `,
      [id],
    );

    if (!row) return null;

    return {
      ...row,
      file_name: getImageUrl(row.file_name),
    };
  },

  /**
   * Get raw document by id (untransformed file path).
   */
  async getByIdRaw(id, conn) {
    const db = conn || getDB();

    const [[row]] = await db.query(
      `
      SELECT id, customer_id, document_type, document_number, file_name, verified, uploaded_at
      FROM customer_documents
      WHERE id = ?
      `,
      [id],
    );

    return row || null;
  },

  /**
   * Get document by customer id and document type.
   */
  async getByCustomerAndType(customerId, documentType, conn) {
    const db = conn || getDB();

    const [[row]] = await db.query(
      `
      SELECT id, customer_id, document_type, document_number, file_name, verified, uploaded_at
      FROM customer_documents
      WHERE customer_id = ? AND document_type = ?
      LIMIT 1
      `,
      [customerId, documentType],
    );

    return row || null;
  },

  /**
   * Update document verification status / number.
   */
  async update(id, data) {
    const db = getDB();

    const fields = [];
    const values = [];

    if (data.document_number !== undefined) {
      fields.push("document_number = ?");
      values.push(data.document_number);
    }

    if (data.verified !== undefined) {
      fields.push("verified = ?");
      values.push(data.verified);
    }

    if (fields.length === 0) return;

    values.push(id);

    await db.query(
      `
      UPDATE customer_documents
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values,
    );
  },

  /**
   * Delete a single document by id (deletes physical file and DB record).
   */
  async deleteDocument(customerId, documentId) {
    const db = getDB();

    const [[doc]] = await db.query(
      `
      SELECT id, customer_id, file_name
      FROM customer_documents
      WHERE id = ? AND customer_id = ?
      `,
      [documentId, customerId],
    );

    if (!doc) {
      throw { status: 404, message: "Document not found" };
    }

    // 1. Delete physical file from disk
    if (doc.file_name) {
      deleteFile(doc.file_name);
    }

    // 2. Delete database record
    await db.query(
      `
      DELETE FROM customer_documents
      WHERE id = ?
      `,
      [documentId],
    );

    return { success: true, message: "Document deleted successfully" };
  },

  /**
   * Delete document by customer id and document type.
   */
  async deleteDocumentByType(customerId, documentType) {
    const db = getDB();

    const [[doc]] = await db.query(
      `
      SELECT id, customer_id, file_name
      FROM customer_documents
      WHERE customer_id = ? AND document_type = ?
      `,
      [customerId, documentType],
    );

    if (!doc) {
      throw { status: 404, message: "Document not found" };
    }

    // 1. Delete physical file from disk
    if (doc.file_name) {
      deleteFile(doc.file_name);
    }

    // 2. Delete database record
    await db.query(
      `
      DELETE FROM customer_documents
      WHERE id = ?
      `,
      [doc.id],
    );

    return { success: true, message: "Document deleted successfully" };
  },

  /**
   * Delete all documents for a customer (deletes physical files and DB records).
   */
  async deleteAllByCustomerId(customerId, conn) {
    const db = conn || getDB();

    const [docs] = await db.query(
      `
      SELECT id, file_name
      FROM customer_documents
      WHERE customer_id = ?
      `,
      [customerId],
    );

    // Delete all physical files
    for (const doc of docs) {
      if (doc.file_name) {
        deleteFile(doc.file_name);
      }
    }

    // Delete DB records
    await db.query(
      `
      DELETE FROM customer_documents
      WHERE customer_id = ?
      `,
      [customerId],
    );

    return docs.length;
  },

  /**
   * Delete a document record by id.
   */
  async remove(id) {
    const db = getDB();

    const [result] = await db.query(
      `
      DELETE FROM customer_documents
      WHERE id = ?
      `,
      [id],
    );

    return result.affectedRows;
  },
};
