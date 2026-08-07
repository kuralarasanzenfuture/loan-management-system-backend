import { getDB } from "../../config/db.js";
import { getImageUrl } from "../../utils/imageUrl.js";

export const CustomerModel = {
  async create(conn, data) {
    const db = conn || getDB();

    const [result] = await db.query(
      `
INSERT INTO customers
(
customer_no,
first_name,
last_name,
father_name,
mother_name,
mobile,
alternate_mobile,
aadhaar_no,
pan_no,
dob,
gender,
occupation,
monthly_income,
address,
city,
district,
state,
pincode,
photo,
reference_name,
reference_mobile,
remarks,
status,
created_by
)
VALUES
(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`,
      [
        data.customer_no,
        data.first_name,
        data.last_name,
        data.father_name,
        data.mother_name,
        data.mobile,
        data.alternate_mobile,
        data.aadhaar_no,
        data.pan_no,
        data.dob,
        data.gender,
        data.occupation,
        data.monthly_income,
        data.address,
        data.city,
        data.district,
        data.state,
        data.pincode,
        data.photo,
        data.reference_name,
        data.reference_mobile,
        data.remarks,
        data.status || "active",
        data.created_by,
      ],
    );

    return result.insertId;
  },

  async findAll() {
    const db = getDB();

    const [rows] = await db.query(
      `
    SELECT *
    FROM customers
    ORDER BY id DESC
    `,
    );

    // Transform photo paths into full URLs globally for all rows
    return rows.map((customer) => ({
      ...customer,
      photo: getImageUrl(customer.photo),
    }));
  },

  async findById(id) {
    const db = getDB();

    const [[row]] = await db.query(
      `
SELECT *
FROM customers
WHERE id=?
`,
      [id],
    );

    return row ? { ...row, photo: getImageUrl(row.photo) } : null;
  },

  async update(conn, id, data) {
    const db = conn || getDB();

    const fields = [];
    const values = [];

    // Only update fields that are provided (partial update support)
    const updatableFields = [
      "first_name",
      "last_name",
      "father_name",
      "mother_name",
      "mobile",
      "alternate_mobile",
      "aadhaar_no",
      "pan_no",
      "dob",
      "gender",
      "occupation",
      "monthly_income",
      "address",
      "city",
      "district",
      "state",
      "pincode",
      "photo",
      "reference_name",
      "reference_mobile",
      "remarks",
      "status",
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return;

    values.push(id);

    await db.query(
      `
UPDATE customers SET
${fields.join(", ")}
WHERE id=?
`,
      values,
    );
  },

  async remove(id) {
    const db = getDB();

    const [result] = await db.query(
      `
UPDATE customers
SET status='inactive'
WHERE id=?
`,
      [id],
    );

    return result.affectedRows;
  },
};
