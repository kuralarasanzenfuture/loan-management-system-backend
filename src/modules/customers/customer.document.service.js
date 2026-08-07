import { getDB } from "../../config/db.js";
import { getImageUrl } from "../../utils/imageUrl.js";

// Fields that are NOT customer documents (handled separately)
const NON_DOCUMENT_FIELDS = ["photo"];

export const CustomerDocumentService = {
  /**
   * Insert document records for a customer inside an existing transaction.
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

      for (const file of fileArray) {
        // 🔥 Store the correct relative path so getImageUrl can build the full URL
        // File is saved at: uploads/customers/<fieldName>/<file.filename>
        const relativePath = `uploads/customers/${fieldName}/${file.filename}`;

        // 🔥 document_number may be sent in the body keyed by document type
        const documentNumber = body[`${fieldName}_number`] || null;

        await conn.query(
          `
          INSERT INTO customer_documents (
            customer_id,
            document_type,
            document_number,
            file_name
          ) VALUES (?,?,?,?)
          `,
          [customerId, fieldName, documentNumber, relativePath],
        );
        count++;
      }
    }

    return count;
  },

  /**
   * Get all documents for a customer.
   */
  async getByCustomerId(customerId) {
    const db = getDB();

    const [rows] = await db.query(
      `
    SELECT id, document_type, document_number, file_name, verified, uploaded_at
    FROM customer_documents
    WHERE customer_id = ?
    ORDER BY uploaded_at DESC
    `,
      [customerId],
    );

    // Map through each document row to attach the full URL to file_name
    return rows.map((doc) => ({
      ...doc,
      file_name: getImageUrl(doc.file_name),
    }));
  },

  /**
   * Get a single document by id.
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

    // 🔥 Attach full URL to file_name
    return {
      ...row,
      file_name: getImageUrl(row.file_name),
    };
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
   * Delete a document record (and optionally the file).
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
