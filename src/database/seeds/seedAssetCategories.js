import { getDB } from "../../config/db.js";

const ASSET_CATEGORIES_DATA = [
  {
    category_name: "IT & Computing Hardware",
    description:
      "Laptops, desktop computers, servers, networking gear, monitors, and peripherals.",
    status: "active",
  },
  {
    category_name: "Office Furniture & Fixtures",
    description:
      "Desks, ergonomic chairs, conference tables, storage cabinets, and partition walls.",
    status: "active",
  },
  {
    category_name: "Vehicles & Transport",
    description:
      "Company cars, delivery vans, field operation motorcycles, and logistics vehicles.",
    status: "active",
  },
  {
    category_name: "Office Electronics & Appliances",
    description:
      "Air conditioners, televisions, projectors, printers, photocopiers, and refrigerators.",
    status: "active",
  },
  {
    category_name: "Cash & Financial Assets",
    description:
      "Petty cash reserves, vault balances, term deposits, and liquid monetary holdings.",
    status: "active",
  },
  {
    category_name: "Plant & Machinery",
    description:
      "Heavy machinery, generators, power backups (UPS), and specialized operational equipment.",
    status: "active",
  },
  {
    category_name: "Real Estate & Property",
    description:
      "Owned office premises, land parcels, branch buildings, and warehouse facilities.",
    status: "active",
  },
  {
    category_name: "Security & Surveillance Systems",
    description:
      "CCTV cameras, biometric access control systems, fire alarms, and vault safes.",
    status: "active",
  },
  {
    category_name: "Software & Intangibles",
    description:
      "Enterprise software licenses, domain names, mobile applications, and proprietary tools.",
    status: "active",
  },
  {
    category_name: "Mobile Devices & Tablets",
    description:
      "Company-issued smartphones, field collection tablets, and POS devices.",
    status: "active",
  },
];

export const SeedAssetCategories = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(" ⏳ Seeding Asset Categories...");

    for (const category of ASSET_CATEGORIES_DATA) {
      await connection.beginTransaction();

      // Check if category exists by name
      const [existing] = await connection.query(
        `SELECT id FROM asset_categories WHERE category_name = ?`,
        [category.category_name],
      );

      if (existing.length === 0) {
        // Insert new category
        await connection.query(
          `
          INSERT INTO asset_categories (category_name, description, status)
          VALUES (?, ?, ?)
          `,
          [category.category_name, category.description, category.status],
        );
      } else {
        // Update existing category
        await connection.query(
          `
          UPDATE asset_categories SET
            description = ?,
            status = ?
          WHERE id = ?
          `,
          [category.description, category.status, existing[0].id],
        );
      }

      await connection.commit();
    }

    console.log(" ✅ Asset Categories seeded successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding Asset Categories:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
