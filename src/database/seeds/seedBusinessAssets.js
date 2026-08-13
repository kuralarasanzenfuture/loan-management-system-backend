// import { getDB } from "../../config/db.js";

// const BUSINESS_ASSETS_DATA = [
//   // --- IT & Computing Hardware ---
//   {
//     asset_no: "AST-IT-2024-001",
//     category_name: "IT & Computing Hardware",
//     asset_name: "MacBook Pro 16-inch M3 Max",
//     brand: "Apple",
//     model: "MBP 16 M3 Max 36GB",
//     serial_number: "C02G1234MD6R",
//     description: "Primary workstation for lead software engineer.",
//     purchase_price: 349900.0,
//     purchase_date: "2024-01-15",
//     vendor_name: "Imagine Apple Premium Reseller",
//     invoice_number: "INV-2024-0891",
//     current_value: 310000.0,
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/macbook_pro_16.png",
//     location: "Head Office - IT Dept (Floor 2)",
//     condition_status: "new",
//     status: "active",
//     remarks: "Assigned to Lead Architect.",
//   },
//   {
//     asset_no: "AST-IT-2024-002",
//     category_name: "IT & Computing Hardware",
//     asset_name: "Dell ThinkStation Workstation PC",
//     brand: "Dell",
//     model: "OptiPlex 7010 Tower",
//     serial_number: "DELL-7010-88219",
//     description: "Desktop PC for accounting and core banking server access.",
//     purchase_price: 78000.0,
//     purchase_date: "2023-11-10",
//     vendor_name: "Dell India Official Store",
//     invoice_number: "INV-DEL-5512",
//     current_value: 65000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/dell_optiplex.png",
//     location: "Head Office - Finance Desk",
//     condition_status: "good",
//     status: "active",
//     remarks: "Configured with dual display setups.",
//   },
//   {
//     asset_no: "AST-IT-2024-003",
//     category_name: "IT & Computing Hardware",
//     asset_name: "Rackmount Database Server",
//     brand: "HPE",
//     model: "ProLiant DL380 Gen10",
//     serial_number: "HPE-DL380-99120",
//     description: "On-premise primary database and backup server.",
//     purchase_price: 520000.0,
//     purchase_date: "2023-06-20",
//     vendor_name: "Redington India Ltd",
//     invoice_number: "RED-SERVER-0041",
//     current_value: 410000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/hpe_server.png",
//     location: "Server Room - Rack A",
//     condition_status: "good",
//     status: "active",
//     remarks: "Maintained under annual AMC contract.",
//   },
//   {
//     asset_no: "AST-IT-2024-004",
//     category_name: "IT & Computing Hardware",
//     asset_name: "Ubiquiti UniFi Managed Network Switch",
//     brand: "Ubiquiti",
//     model: "USW-Pro-48-POE",
//     serial_number: "UBI-48POE-3341",
//     description: "48-Port Power over Ethernet switch for office LAN.",
//     purchase_price: 95000.0,
//     purchase_date: "2023-08-05",
//     vendor_name: "Network Solutions Pvt Ltd",
//     invoice_number: "NET-INV-882",
//     current_value: 80000.0,
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/ubiquiti_switch.png",
//     location: "Server Room - Network Rack",
//     condition_status: "good",
//     status: "active",
//     remarks: "Powers IP phones and CCTV cameras.",
//   },

//   // --- Mobile Devices & Tablets ---
//   {
//     asset_no: "AST-MOB-2024-005",
//     category_name: "Mobile Devices & Tablets",
//     asset_name: "Samsung Galaxy Tab A9+ (Field Collection)",
//     brand: "Samsung",
//     model: "Galaxy Tab A9+ LTE",
//     serial_number: "R52X1234567Y",
//     description:
//       "Tablet assigned to field collection agents for daily EMI tracking.",
//     purchase_price: 22000.0,
//     purchase_date: "2024-02-01",
//     vendor_name: "Reliance Digital",
//     invoice_number: "RD-TAB-9012",
//     current_value: 19500.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/galaxy_tab.png",
//     location: "Field Branch 1 - Koramangala",
//     condition_status: "new",
//     status: "active",
//     remarks: "Installed with field collection app.",
//   },

//   // --- Office Electronics & Appliances ---
//   {
//     asset_no: "AST-ELC-2024-006",
//     category_name: "Office Electronics & Appliances",
//     asset_name: "Epson Heavy Duty Multi-Function Printer",
//     brand: "Epson",
//     model: "EcoTank L15150",
//     serial_number: "EPS-L15150-7711",
//     description: "High-volume duplex printer, scanner, and copier.",
//     purchase_price: 82000.0,
//     purchase_date: "2023-09-12",
//     vendor_name: "Croma Electronics",
//     invoice_number: "CRO-PRN-4420",
//     current_value: 68000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/epson_printer.png",
//     location: "Main Office - Documentation Hub",
//     condition_status: "good",
//     status: "active",
//     remarks: "Connected to local network via ethernet.",
//   },
//   {
//     asset_no: "AST-ELC-2024-007",
//     category_name: "Office Electronics & Appliances",
//     asset_name: "Daikin 2.0 Ton Inverter Split Air Conditioner",
//     brand: "Daikin",
//     model: "FTKG60TV",
//     serial_number: "DAI-AC-883912",
//     description: "Split AC for main hall cooling.",
//     purchase_price: 64000.0,
//     purchase_date: "2022-04-10",
//     vendor_name: "Girias Electronics",
//     invoice_number: "GIR-AC-1029",
//     current_value: 42000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/daikin_ac.png",
//     location: "Head Office - Main Workstation Area",
//     condition_status: "good",
//     status: "active",
//     remarks: "Serviced biannually.",
//   },
//   {
//     asset_no: "AST-ELC-2024-008",
//     category_name: "Office Electronics & Appliances",
//     asset_name: "BenQ 4K Conference Room Projector",
//     brand: "BenQ",
//     model: "TK850i",
//     serial_number: "BNQ-PRJ-3021",
//     description: "Smart UHD projector for boardroom presentations.",
//     purchase_price: 135000.0,
//     purchase_date: "2023-03-18",
//     vendor_name: "Vijay Sales",
//     invoice_number: "VS-BENQ-8801",
//     current_value: 105000.0,
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/benq_projector.png",
//     location: "Boardroom - Ceiling Mount",
//     condition_status: "good",
//     status: "active",
//     remarks: "Includes wireless dongle.",
//   },

//   // --- Office Furniture & Fixtures ---
//   {
//     asset_no: "AST-FUR-2024-009",
//     category_name: "Office Furniture & Fixtures",
//     asset_name: "Featherlite Executive Mesh Chairs (Set of 10)",
//     brand: "Featherlite",
//     model: "Helix High Back",
//     serial_number: "FL-HLX-SET10",
//     description: "Ergonomic mesh chairs for management team.",
//     purchase_price: 145000.0,
//     purchase_date: "2023-02-14",
//     vendor_name: "Featherlite Official Experience Center",
//     invoice_number: "FL-INV-7721",
//     current_value: 110000.0,
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/featherlite_chair.png",
//     location: "Managerial Cabins 1 to 5",
//     condition_status: "good",
//     status: "active",
//     remarks: "Includes 3-year manufacturer warranty.",
//   },
//   {
//     asset_no: "AST-FUR-2024-010",
//     category_name: "Office Furniture & Fixtures",
//     asset_name: "Modular 12-Person Boardroom Table",
//     brand: "Godrej Interio",
//     model: "Conference-Pro 12",
//     serial_number: "GI-CONF-12P",
//     description:
//       "Teak finish wooden conference table with built-in power sockets.",
//     purchase_price: 180000.0,
//     purchase_date: "2022-11-05",
//     vendor_name: "Godrej Interio Showroom",
//     invoice_number: "GI-2022-9901",
//     current_value: 135000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/godrej_table.png",
//     location: "Boardroom",
//     condition_status: "good",
//     status: "active",
//     remarks: "Includes cable management trays.",
//   },
//   {
//     asset_no: "AST-FUR-2024-011",
//     category_name: "Office Furniture & Fixtures",
//     asset_name: "Fireproof Document Storage Safe Cabinet",
//     brand: "Godrej Security",
//     model: "Defender Prime 42",
//     serial_number: "GOD-SAFE-9921",
//     description:
//       "Heavy-duty fire-resistant safe for storing physical loan agreements.",
//     purchase_price: 115000.0,
//     purchase_date: "2021-08-20",
//     vendor_name: "Godrej & Boyce Mfg Co",
//     invoice_number: "GB-SAFE-4421",
//     current_value: 90000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/godrej_safe.png",
//     location: "Records Vault Room",
//     condition_status: "good",
//     status: "active",
//     remarks: "Dual key and digital combination lock.",
//   },

//   // --- Vehicles & Transport ---
//   {
//     asset_no: "AST-VEH-2024-012",
//     category_name: "Vehicles & Transport",
//     asset_name: "Maruti Suzuki Swift (Field Operations)",
//     brand: "Maruti Suzuki",
//     model: "Swift VXi",
//     serial_number: "VIN-KA01MA123456",
//     description: "Branch manager vehicle for field audits and branch visits.",
//     purchase_price: 750000.0,
//     purchase_date: "2022-05-10",
//     vendor_name: "Mandovi Motors",
//     invoice_number: "MM-SWIFT-2022",
//     current_value: 58000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/maruti_swift.png",
//     location: "Head Office Parking",
//     condition_status: "good",
//     status: "active",
//     remarks: "Comprehensive insurance active.",
//   },
//   {
//     asset_no: "AST-VEH-2024-013",
//     category_name: "Vehicles & Transport",
//     asset_name: "Hero Splendor Plus (Collection Bike 1)",
//     brand: "Hero MotoCorp",
//     model: "Splendor+ i3S",
//     serial_number: "VIN-KA01HE98765",
//     description: "Field collection motorcycle for daily market visits.",
//     purchase_price: 85000.0,
//     purchase_date: "2023-01-12",
//     vendor_name: "Sai Hero Dealers",
//     invoice_number: "SH-BIKE-3312",
//     current_value: 70000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/hero_splendor.png",
//     location: "Branch 2 - Market Area",
//     condition_status: "good",
//     status: "active",
//     remarks: "Assigned to Senior Collector.",
//   },

//   // --- Security & Surveillance Systems ---
//   {
//     asset_no: "AST-SEC-2024-014",
//     category_name: "Security & Surveillance Systems",
//     asset_name: "Hikvision 16-Channel 4K CCTV Camera Kit",
//     brand: "Hikvision",
//     model: "DS-7616NI-K2 / 16P",
//     serial_number: "HIK-NVR-16CH-991",
//     description: "Surveillance NVR with 16 Dome and Bullet Cameras + 8TB HDD.",
//     purchase_price: 110000.0,
//     purchase_date: "2023-04-05",
//     vendor_name: "Secure Eye Solutions",
//     invoice_number: "SES-CCTV-0021",
//     current_value: 88000.0,
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/hikvision_cctv.png",
//     location: "Server Room - Monitor Wall",
//     condition_status: "good",
//     status: "active",
//     remarks: "24/7 continuous recording with cloud backup.",
//   },
//   {
//     asset_no: "AST-SEC-2024-015",
//     category_name: "Security & Surveillance Systems",
//     asset_name: "eSSL Biometric Attendance & Door Access System",
//     brand: "eSSL",
//     model: "X990 Access Terminal",
//     serial_number: "ESSL-X990-2023",
//     description:
//       "Fingerprint and face recognition access control for entry gate.",
//     purchase_price: 28000.0,
//     purchase_date: "2023-02-18",
//     vendor_name: "Secure Eye Solutions",
//     invoice_number: "SES-BIO-0112",
//     current_value: 21000.0,
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/essl_biometric.png",
//     location: "Main Entrance Door",
//     condition_status: "good",
//     status: "active",
//     remarks: "Integrated with HR payroll system.",
//   },

//   // --- Plant & Machinery ---
//   {
//     asset_no: "AST-MAC-2024-016",
//     category_name: "Plant & Machinery",
//     asset_name: "Kirloskar 25 kVA Diesel Generator Set",
//     brand: "Kirloskar",
//     model: "KG1-25WS",
//     serial_number: "KIR-GEN-25KVA-88",
//     description: "Silent canopy diesel generator for office power backup.",
//     purchase_price: 380000.0,
//     purchase_date: "2021-12-01",
//     vendor_name: "Kirloskar Oil Engines Ltd",
//     invoice_number: "KIR-INV-5510",
//     current_value: 280000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/kirloskar_gen.png",
//     location: "Ground Floor - Generator Yard",
//     condition_status: "good",
//     status: "active",
//     remarks: "Auto-transfer switch installed.",
//   },
//   {
//     asset_no: "AST-MAC-2024-017",
//     category_name: "Plant & Machinery",
//     asset_name: "APC 10kVA Online UPS Power Backup",
//     brand: "APC Schneider",
//     model: "SRT10KXLI",
//     serial_number: "APC-UPS-10KVA-321",
//     description: "Uninterrupted power supply for server room and core network.",
//     purchase_price: 210000.0,
//     purchase_date: "2022-09-15",
//     vendor_name: "Schneider Electric India",
//     invoice_number: "SE-UPS-8812",
//     current_value: 155000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/apc_ups.png",
//     location: "Server Room - Battery Bank",
//     condition_status: "good",
//     status: "active",
//     remarks: "Batteries replaced in late 2023.",
//   },

//   // --- Cash & Financial Assets ---
//   {
//     asset_no: "AST-FIN-2024-018",
//     category_name: "Cash & Financial Assets",
//     asset_name: "Kores High-Speed Currency Counting Machine",
//     brand: "Kores",
//     model: "Count-Easy 88",
//     serial_number: "KOR-CNT-2023-99",
//     description: "Banknote counter with UV/MG fake note detector.",
//     purchase_price: 32000.0,
//     purchase_date: "2023-05-22",
//     vendor_name: "Kores India Ltd",
//     invoice_number: "KOR-INV-1102",
//     current_value: 25000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/kores_counter.png",
//     location: "Cashier Counter 1",
//     condition_status: "good",
//     status: "active",
//     remarks: "Supports dual currency detection.",
//   },

//   // --- Software & Intangibles ---
//   {
//     asset_no: "AST-SOFT-2024-019",
//     category_name: "Software & Intangibles",
//     asset_name: "Microsoft 365 Business Premium (50 User Seats)",
//     brand: "Microsoft",
//     model: "M365 Enterprise Subscription",
//     serial_number: "MS-365-LIC-2024",
//     description: "Annual enterprise cloud software and email suite.",
//     purchase_price: 270000.0,
//     purchase_date: "2024-01-01",
//     vendor_name: "SoftwareONE India",
//     invoice_number: "SWO-MS-9012",
//     current_value: 270000.0,
//     image: "https://storage.cmmicrofinance.com/assets/images/m365_logo.png",
//     location: "Cloud Digital Asset",
//     condition_status: "new",
//     status: "active",
//     remarks: "Renews annually in January.",
//   },

//   // --- Real Estate & Property ---
//   {
//     asset_no: "AST-PROP-2024-020",
//     category_name: "Real Estate & Property",
//     asset_name: "Branch Office Commercial Leasehold Property",
//     brand: "N/A",
//     model: "Commercial Building Space (3,500 sq.ft)",
//     serial_number: "PROP-BLR-KOR-45A",
//     description:
//       "Leasehold interior fit-out and structural asset for head office premises.",
//     purchase_price: 2500000.0,
//     purchase_date: "2021-04-01",
//     vendor_name: "Koramangala Commercial Realty",
//     invoice_number: "LEASE-2021-001",
//     current_value: 1900000.0,
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/office_building.png",
//     location: "Door No. 45/A, Koramangala, Bengaluru",
//     condition_status: "good",
//     status: "active",
//     remarks: "10-year lease agreement.",
//   },
// ];

// export const SeedBusinessAssets = async () => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     console.log(" ⏳ Seeding 20 Office Business Assets...");

//     // 1. Fetch fallback user ID for audit columns
//     const [users] = await connection.query("SELECT id FROM users LIMIT 1");
//     const createdByUserId = users.length > 0 ? users[0].id : 1;

//     // 2. Load category lookup map (Category Name -> ID)
//     const [categories] = await connection.query(
//       "SELECT id, category_name FROM asset_categories",
//     );
//     const categoryMap = new Map();
//     categories.forEach((cat) => {
//       categoryMap.set(cat.category_name, cat.id);
//     });

//     const defaultCategoryId = categories.length > 0 ? categories[0].id : 1;

//     for (const asset of BUSINESS_ASSETS_DATA) {
//       await connection.beginTransaction();

//       // Resolve category_id dynamically
//       const categoryId =
//         categoryMap.get(asset.category_name) || defaultCategoryId;

//       // Check if asset exists by unique asset_no
//       const [existing] = await connection.query(
//         `SELECT id FROM business_assets WHERE asset_no = ?`,
//         [asset.asset_no],
//       );

//       if (existing.length === 0) {
//         // Insert new asset
//         await connection.query(
//           `
//           INSERT INTO business_assets (
//             asset_no, category_id, asset_name, brand, model, serial_number,
//             description, purchase_price, purchase_date, vendor_name, invoice_number,
//             current_value, image, location, condition_status, status, remarks, created_by
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           `,
//           [
//             asset.asset_no,
//             categoryId,
//             asset.asset_name,
//             asset.brand,
//             asset.model,
//             asset.serial_number,
//             asset.description,
//             asset.purchase_price,
//             asset.purchase_date,
//             asset.vendor_name,
//             asset.invoice_number,
//             asset.current_value,
//             asset.image,
//             asset.location,
//             asset.condition_status,
//             asset.status,
//             asset.remarks,
//             createdByUserId,
//           ],
//         );
//       } else {
//         // Update existing asset
//         await connection.query(
//           `
//           UPDATE business_assets SET
//             category_id = ?,
//             asset_name = ?,
//             brand = ?,
//             model = ?,
//             serial_number = ?,
//             description = ?,
//             purchase_price = ?,
//             purchase_date = ?,
//             vendor_name = ?,
//             invoice_number = ?,
//             current_value = ?,
//             image = ?,
//             location = ?,
//             condition_status = ?,
//             status = ?,
//             remarks = ?,
//             updated_by = ?
//           WHERE id = ?
//           `,
//           [
//             categoryId,
//             asset.asset_name,
//             asset.brand,
//             asset.model,
//             asset.serial_number,
//             asset.description,
//             asset.purchase_price,
//             asset.purchase_date,
//             asset.vendor_name,
//             asset.invoice_number,
//             asset.current_value,
//             asset.image,
//             asset.location,
//             asset.condition_status,
//             asset.status,
//             asset.remarks,
//             createdByUserId,
//             existing[0].id,
//           ],
//         );
//       }

//       await connection.commit();
//     }

//     console.log(" ✅ 20 Business Assets seeded successfully!");
//   } catch (error) {
//     await connection.rollback();
//     console.error("❌ Error seeding Business Assets:", error.message);
//     throw error;
//   } finally {
//     connection.release();
//   }
// };
/* ---------------------------------------------------*/
// import { getDB } from "../../config/db.js";

// const BUSINESS_ASSETS_DATA = [
//   // --- IT & Computing Hardware ---
//   {
//     asset_no: "AST-IT-2026-001",
//     category_name: "IT & Computing Hardware",
//     asset_name: "MacBook Pro 16-inch M3 Max",
//     brand: "Apple",
//     model: "MBP 16 M3 Max 36GB",
//     serial_number: "C02G1234MD6R",
//     description: "Primary workstation for lead software engineer.",
//     purchase_price: 349900.0,
//     purchase_date: "2026-01-15",
//     quantity: 1,
//     vendor_name: "Imagine Apple Premium Reseller",
//     invoice_number: "INV-2026-0891",
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/macbook_pro_16.png",
//     location: "Head Office - IT Dept (Floor 2)",
//     condition_status: "new",
//     status: "active",
//     remarks: "Assigned to Lead Architect.",
//   },
//   {
//     asset_no: "AST-IT-2026-002",
//     category_name: "IT & Computing Hardware",
//     asset_name: "Dell ThinkStation Workstation PC",
//     brand: "Dell",
//     model: "OptiPlex 7010 Tower",
//     serial_number: "DELL-7010-88219",
//     description: "Desktop PC setup for finance and accounts department.",
//     purchase_price: 78000.0,
//     purchase_date: "2025-11-10",
//     quantity: 5,
//     vendor_name: "Dell India Official Store",
//     invoice_number: "INV-DEL-5512",
//     image: "https://storage.cmmicrofinance.com/assets/images/dell_optiplex.png",
//     location: "Head Office - Finance Desk",
//     condition_status: "good",
//     status: "active",
//     remarks: "Configured with dual display setups.",
//   },
//   {
//     asset_no: "AST-IT-2026-003",
//     category_name: "IT & Computing Hardware",
//     asset_name: "Rackmount Database Server",
//     brand: "HPE",
//     model: "ProLiant DL380 Gen10",
//     serial_number: "HPE-DL380-99120",
//     description: "On-premise primary database and backup server.",
//     purchase_price: 520000.0,
//     purchase_date: "2025-06-20",
//     quantity: 1,
//     vendor_name: "Redington India Ltd",
//     invoice_number: "RED-SERVER-0041",
//     image: "https://storage.cmmicrofinance.com/assets/images/hpe_server.png",
//     location: "Server Room - Rack A",
//     condition_status: "good",
//     status: "active",
//     remarks: "Maintained under annual AMC contract.",
//   },
//   {
//     asset_no: "AST-IT-2026-004",
//     category_name: "IT & Computing Hardware",
//     asset_name: "Ubiquiti UniFi Managed Network Switch",
//     brand: "Ubiquiti",
//     model: "USW-Pro-48-POE",
//     serial_number: "UBI-48POE-3341",
//     description: "48-Port Power over Ethernet switch for office network.",
//     purchase_price: 95000.0,
//     purchase_date: "2025-08-05",
//     quantity: 2,
//     vendor_name: "Network Solutions Pvt Ltd",
//     invoice_number: "NET-INV-882",
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/ubiquiti_switch.png",
//     location: "Server Room - Network Rack",
//     condition_status: "good",
//     status: "active",
//     remarks: "Powers IP phones and CCTV cameras.",
//   },

//   // --- Mobile Devices & Tablets ---
//   {
//     asset_no: "AST-MOB-2026-001",
//     category_name: "Mobile Devices & Tablets",
//     asset_name: "Samsung Galaxy Tab A9+ (Field Collection)",
//     brand: "Samsung",
//     model: "Galaxy Tab A9+ LTE",
//     serial_number: "R52X1234567Y",
//     description:
//       "Tablets assigned to field collection agents for daily EMI tracking.",
//     purchase_price: 22000.0,
//     purchase_date: "2026-02-01",
//     quantity: 15,
//     vendor_name: "Reliance Digital",
//     invoice_number: "RD-TAB-9012",
//     image: "https://storage.cmmicrofinance.com/assets/images/galaxy_tab.png",
//     location: "Field Branch 1 - Koramangala",
//     condition_status: "new",
//     status: "active",
//     remarks: "Pre-installed with field collection application.",
//   },

//   // --- Office Electronics & Appliances ---
//   {
//     asset_no: "AST-ELC-2026-001",
//     category_name: "Office Electronics & Appliances",
//     asset_name: "Epson Heavy Duty Multi-Function Printer",
//     brand: "Epson",
//     model: "EcoTank L15150",
//     serial_number: "EPS-L15150-7711",
//     description: "High-volume duplex printer, scanner, and copier.",
//     purchase_price: 82000.0,
//     purchase_date: "2025-09-12",
//     quantity: 2,
//     vendor_name: "Croma Electronics",
//     invoice_number: "CRO-PRN-4420",
//     image: "https://storage.cmmicrofinance.com/assets/images/epson_printer.png",
//     location: "Main Office - Documentation Hub",
//     condition_status: "good",
//     status: "active",
//     remarks: "Connected to local network via ethernet.",
//   },
//   {
//     asset_no: "AST-ELC-2026-002",
//     category_name: "Office Electronics & Appliances",
//     asset_name: "Daikin 2.0 Ton Inverter Split Air Conditioner",
//     brand: "Daikin",
//     model: "FTKG60TV",
//     serial_number: "DAI-AC-883912",
//     description: "Split AC units installed for core hall cooling.",
//     purchase_price: 64000.0,
//     purchase_date: "2025-04-10",
//     quantity: 4,
//     vendor_name: "Girias Electronics",
//     invoice_number: "GIR-AC-1029",
//     image: "https://storage.cmmicrofinance.com/assets/images/daikin_ac.png",
//     location: "Head Office - Main Workstation Area",
//     condition_status: "good",
//     status: "active",
//     remarks: "Serviced quarterly under maintenance plan.",
//   },
//   {
//     asset_no: "AST-ELC-2026-003",
//     category_name: "Office Electronics & Appliances",
//     asset_name: "BenQ 4K Conference Room Projector",
//     brand: "BenQ",
//     model: "TK850i",
//     serial_number: "BNQ-PRJ-3021",
//     description: "Smart UHD projector for boardroom presentations.",
//     purchase_price: 135000.0,
//     purchase_date: "2025-03-18",
//     quantity: 1,
//     vendor_name: "Vijay Sales",
//     invoice_number: "VS-BENQ-8801",
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/benq_projector.png",
//     location: "Boardroom - Ceiling Mount",
//     condition_status: "good",
//     status: "active",
//     remarks: "Includes wireless casting dongle.",
//   },

//   // --- Office Furniture & Fixtures ---
//   {
//     asset_no: "AST-FUR-2026-001",
//     category_name: "Office Furniture & Fixtures",
//     asset_name: "Featherlite Executive Mesh Chairs",
//     brand: "Featherlite",
//     model: "Helix High Back",
//     serial_number: "FL-HLX-SET10",
//     description: "Ergonomic mesh chairs for management and admin personnel.",
//     purchase_price: 14500.0,
//     purchase_date: "2025-02-14",
//     quantity: 20,
//     vendor_name: "Featherlite Official Experience Center",
//     invoice_number: "FL-INV-7721",
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/featherlite_chair.png",
//     location: "Managerial Cabins & Staff Workstations",
//     condition_status: "good",
//     status: "active",
//     remarks: "Includes 3-year manufacturer warranty.",
//   },
//   {
//     asset_no: "AST-FUR-2026-002",
//     category_name: "Office Furniture & Fixtures",
//     asset_name: "Modular 12-Person Boardroom Table",
//     brand: "Godrej Interio",
//     model: "Conference-Pro 12",
//     serial_number: "GI-CONF-12P",
//     description:
//       "Teak finish wooden conference table with built-in power sockets.",
//     purchase_price: 180000.0,
//     purchase_date: "2024-11-05",
//     quantity: 1,
//     vendor_name: "Godrej Interio Showroom",
//     invoice_number: "GI-2024-9901",
//     image: "https://storage.cmmicrofinance.com/assets/images/godrej_table.png",
//     location: "Boardroom",
//     condition_status: "good",
//     status: "active",
//     remarks: "Includes cable management pop-up boxes.",
//   },
//   {
//     asset_no: "AST-FUR-2026-003",
//     category_name: "Office Furniture & Fixtures",
//     asset_name: "Fireproof Document Storage Safe Cabinet",
//     brand: "Godrej Security",
//     model: "Defender Prime 42",
//     serial_number: "GOD-SAFE-9921",
//     description:
//       "Heavy-duty fire-resistant safe for storing physical loan agreements.",
//     purchase_price: 115000.0,
//     purchase_date: "2024-08-20",
//     quantity: 2,
//     vendor_name: "Godrej & Boyce Mfg Co",
//     invoice_number: "GB-SAFE-4421",
//     image: "https://storage.cmmicrofinance.com/assets/images/godrej_safe.png",
//     location: "Records Vault Room",
//     condition_status: "good",
//     status: "active",
//     remarks: "Dual key and digital combination lock.",
//   },

//   // --- Vehicles & Transport ---
//   {
//     asset_no: "AST-VEH-2026-001",
//     category_name: "Vehicles & Transport",
//     asset_name: "Maruti Suzuki Swift (Field Operations)",
//     brand: "Maruti Suzuki",
//     model: "Swift VXi",
//     serial_number: "VIN-KA01MA123456",
//     description: "Branch manager vehicle for field audits and regional visits.",
//     purchase_price: 750000.0,
//     purchase_date: "2024-05-10",
//     quantity: 1,
//     vendor_name: "Mandovi Motors",
//     invoice_number: "MM-SWIFT-2024",
//     image: "https://storage.cmmicrofinance.com/assets/images/maruti_swift.png",
//     location: "Head Office Parking",
//     condition_status: "good",
//     status: "active",
//     remarks: "Comprehensive insurance policy active.",
//   },
//   {
//     asset_no: "AST-VEH-2026-002",
//     category_name: "Vehicles & Transport",
//     asset_name: "Hero Splendor Plus (Collection Bike)",
//     brand: "Hero MotoCorp",
//     model: "Splendor+ i3S",
//     serial_number: "VIN-KA01HE98765",
//     description: "Field collection motorcycles for daily loan collection runs.",
//     purchase_price: 85000.0,
//     purchase_date: "2025-01-12",
//     quantity: 4,
//     vendor_name: "Sai Hero Dealers",
//     invoice_number: "SH-BIKE-3312",
//     image: "https://storage.cmmicrofinance.com/assets/images/hero_splendor.png",
//     location: "Branch 2 - Market Area",
//     condition_status: "good",
//     status: "active",
//     remarks: "Assigned to Senior Collection Officers.",
//   },

//   // --- Security & Surveillance Systems ---
//   {
//     asset_no: "AST-SEC-2026-001",
//     category_name: "Security & Surveillance Systems",
//     asset_name: "Hikvision 16-Channel 4K CCTV Camera Kit",
//     brand: "Hikvision",
//     model: "DS-7616NI-K2 / 16P",
//     serial_number: "HIK-NVR-16CH-991",
//     description:
//       "Surveillance NVR setup with 16 Dome and Bullet Cameras + 8TB HDD.",
//     purchase_price: 110000.0,
//     purchase_date: "2025-04-05",
//     quantity: 1,
//     vendor_name: "Secure Eye Solutions",
//     invoice_number: "SES-CCTV-0021",
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/hikvision_cctv.png",
//     location: "Server Room - Monitor Wall",
//     condition_status: "good",
//     status: "active",
//     remarks: "24/7 continuous recording setup.",
//   },
//   {
//     asset_no: "AST-SEC-2026-002",
//     category_name: "Security & Surveillance Systems",
//     asset_name: "eSSL Biometric Attendance & Door Access System",
//     brand: "eSSL",
//     model: "X990 Access Terminal",
//     serial_number: "ESSL-X990-2025",
//     description: "Fingerprint and face recognition access control units.",
//     purchase_price: 28000.0,
//     purchase_date: "2025-02-18",
//     quantity: 3,
//     vendor_name: "Secure Eye Solutions",
//     invoice_number: "SES-BIO-0112",
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/essl_biometric.png",
//     location: "Main Entrance & Server Room Doors",
//     condition_status: "good",
//     status: "active",
//     remarks: "Integrated with HR attendance system.",
//   },

//   // --- Plant & Machinery ---
//   {
//     asset_no: "AST-MAC-2026-001",
//     category_name: "Plant & Machinery",
//     asset_name: "Kirloskar 25 kVA Diesel Generator Set",
//     brand: "Kirloskar",
//     model: "KG1-25WS",
//     serial_number: "KIR-GEN-25KVA-88",
//     description:
//       "Silent canopy diesel generator for uninterrupted office power.",
//     purchase_price: 380000.0,
//     purchase_date: "2024-12-01",
//     quantity: 1,
//     vendor_name: "Kirloskar Oil Engines Ltd",
//     invoice_number: "KIR-INV-5510",
//     image: "https://storage.cmmicrofinance.com/assets/images/kirloskar_gen.png",
//     location: "Ground Floor - Generator Yard",
//     condition_status: "good",
//     status: "active",
//     remarks: "Equipped with automatic transfer switch.",
//   },
//   {
//     asset_no: "AST-MAC-2026-002",
//     category_name: "Plant & Machinery",
//     asset_name: "APC 10kVA Online UPS Power Backup",
//     brand: "APC Schneider",
//     model: "SRT10KXLI",
//     serial_number: "APC-UPS-10KVA-321",
//     description:
//       "Uninterrupted power supply for core server room and switches.",
//     purchase_price: 210000.0,
//     purchase_date: "2024-09-15",
//     quantity: 2,
//     vendor_name: "Schneider Electric India",
//     invoice_number: "SE-UPS-8812",
//     image: "https://storage.cmmicrofinance.com/assets/images/apc_ups.png",
//     location: "Server Room - Battery Bank",
//     condition_status: "good",
//     status: "active",
//     remarks: "Includes external battery bank extension.",
//   },

//   // --- Cash & Financial Assets ---
//   {
//     asset_no: "AST-FIN-2026-001",
//     category_name: "Cash & Financial Assets",
//     asset_name: "Kores High-Speed Currency Counting Machine",
//     brand: "Kores",
//     model: "Count-Easy 88",
//     serial_number: "KOR-CNT-2025-99",
//     description: "Banknote counter with UV/MG counterfeit detection.",
//     purchase_price: 32000.0,
//     purchase_date: "2025-05-22",
//     quantity: 3,
//     vendor_name: "Kores India Ltd",
//     invoice_number: "KOR-INV-1102",
//     image: "https://storage.cmmicrofinance.com/assets/images/kores_counter.png",
//     location: "Cashier Counters 1, 2 & 3",
//     condition_status: "good",
//     status: "active",
//     remarks: "Supports fake note alarm indicator.",
//   },

//   // --- Software & Intangibles ---
//   {
//     asset_no: "AST-SOFT-2026-001",
//     category_name: "Software & Intangibles",
//     asset_name: "Microsoft 365 Business Premium License",
//     brand: "Microsoft",
//     model: "M365 Enterprise Subscription",
//     serial_number: "MS-365-LIC-2026",
//     description: "Annual enterprise productivity and email license suite.",
//     purchase_price: 5400.0,
//     purchase_date: "2026-01-01",
//     quantity: 50,
//     vendor_name: "SoftwareONE India",
//     invoice_number: "SWO-MS-9012",
//     image: "https://storage.cmmicrofinance.com/assets/images/m365_logo.png",
//     location: "Cloud Digital Asset",
//     condition_status: "new",
//     status: "active",
//     remarks: "Renews annually in January.",
//   },

//   // --- Real Estate & Property ---
//   {
//     asset_no: "AST-PROP-2026-001",
//     category_name: "Real Estate & Property",
//     asset_name: "Branch Office Commercial Leasehold Property",
//     brand: "N/A",
//     model: "Commercial Building Space (3,500 sq.ft)",
//     serial_number: "PROP-BLR-KOR-45A",
//     description:
//       "Leasehold interior fit-out and structural asset for head office.",
//     purchase_price: 2500000.0,
//     purchase_date: "2024-04-01",
//     quantity: 1,
//     vendor_name: "Koramangala Commercial Realty",
//     invoice_number: "LEASE-2024-001",
//     image:
//       "https://storage.cmmicrofinance.com/assets/images/office_building.png",
//     location: "Door No. 45/A, Koramangala, Bengaluru",
//     condition_status: "good",
//     status: "active",
//     remarks: "10-year lease agreement.",
//   },
// ];

// export const SeedBusinessAssets = async () => {
//   const db = getDB();
//   const connection = await db.getConnection();

//   try {
//     console.log(" ⏳ Seeding Business Assets matching updated schema...");

//     // 1. Fetch created_by fallback user ID
//     const [users] = await connection.query("SELECT id FROM users LIMIT 1");
//     const createdByUserId = users.length > 0 ? users[0].id : 1;

//     // 2. Fetch category mapping
//     const [categories] = await connection.query(
//       "SELECT id, category_name FROM asset_categories",
//     );
//     const categoryMap = new Map();
//     categories.forEach((cat) => {
//       categoryMap.set(cat.category_name, cat.id);
//     });

//     const defaultCategoryId = categories.length > 0 ? categories[0].id : 1;

//     for (const asset of BUSINESS_ASSETS_DATA) {
//       await connection.beginTransaction();

//       const categoryId =
//         categoryMap.get(asset.category_name) || defaultCategoryId;

//       const [existing] = await connection.query(
//         `SELECT id FROM business_assets WHERE asset_no = ?`,
//         [asset.asset_no],
//       );

//       if (existing.length === 0) {
//         // Insert new record matching schema: includes quantity, purchase_date NOT NULL
//         await connection.query(
//           `
//           INSERT INTO business_assets (
//             asset_no, category_id, asset_name, brand, model, serial_number,
//             description, purchase_price, purchase_date, quantity, vendor_name,
//             invoice_number, image, location, condition_status, status, remarks, created_by
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//           `,
//           [
//             asset.asset_no,
//             categoryId,
//             asset.asset_name,
//             asset.brand,
//             asset.model,
//             asset.serial_number,
//             asset.description,
//             asset.purchase_price,
//             asset.purchase_date,
//             asset.quantity,
//             asset.vendor_name,
//             asset.invoice_number,
//             asset.image,
//             asset.location,
//             asset.condition_status,
//             asset.status,
//             asset.remarks,
//             createdByUserId,
//           ],
//         );
//       } else {
//         // Update existing record
//         await connection.query(
//           `
//           UPDATE business_assets SET
//             category_id = ?,
//             asset_name = ?,
//             brand = ?,
//             model = ?,
//             serial_number = ?,
//             description = ?,
//             purchase_price = ?,
//             purchase_date = ?,
//             quantity = ?,
//             vendor_name = ?,
//             invoice_number = ?,
//             image = ?,
//             location = ?,
//             condition_status = ?,
//             status = ?,
//             remarks = ?,
//             updated_by = ?
//           WHERE id = ?
//           `,
//           [
//             categoryId,
//             asset.asset_name,
//             asset.brand,
//             asset.model,
//             asset.serial_number,
//             asset.description,
//             asset.purchase_price,
//             asset.purchase_date,
//             asset.quantity,
//             asset.vendor_name,
//             asset.invoice_number,
//             asset.image,
//             asset.location,
//             asset.condition_status,
//             asset.status,
//             asset.remarks,
//             createdByUserId,
//             existing[0].id,
//           ],
//         );
//       }

//       await connection.commit();
//     }

//     console.log(
//       " ✅ Business Assets seeded successfully with new quantity field!",
//     );
//   } catch (error) {
//     await connection.rollback();
//     console.error("❌ Error seeding Business Assets:", error.message);
//     throw error;
//   } finally {
//     connection.release();
//   }
// };

/*--------------------------------------*/
import { getDB } from "../../config/db.js";

const ALL_BUSINESS_ASSETS = [
  // ==========================================
  // 1. SPECIFIC TABLE ASSETS (AST-00001 to AST-00005)
  // ==========================================
  {
    asset_no: "AST-00001",
    asset_name: "Dell Laptop",
    category_name: "IT & Computing Hardware",
    quantity: 2,
    purchase_price: 65000.0,
    purchase_date: "2026-08-01",
    vendor_name: "ABC Computers",
    status: "active",
  },
  {
    asset_no: "AST-00002",
    asset_name: "HP Printer",
    category_name: "Office Electronics & Appliances",
    quantity: 1,
    purchase_price: 25000.0,
    purchase_date: "2026-08-03",
    vendor_name: "XYZ Technologies",
    status: "active",
  },
  {
    asset_no: "AST-00003",
    asset_name: "Office Table",
    category_name: "Office Furniture & Fixtures",
    quantity: 5,
    purchase_price: 12000.0,
    purchase_date: "2026-08-05",
    vendor_name: "Modern Furniture",
    status: "active",
  },
  {
    asset_no: "AST-00004",
    asset_name: "CCTV Camera",
    category_name: "Security & Surveillance Systems",
    quantity: 8,
    purchase_price: 4500.0,
    purchase_date: "2026-08-06",
    vendor_name: "Secure Systems",
    status: "active",
  },
  {
    asset_no: "AST-00005",
    asset_name: "Honda Activa",
    category_name: "Vehicles & Transport",
    quantity: 1,
    purchase_price: 105000.0,
    purchase_date: "2026-08-07",
    vendor_name: "ABC Motors",
    status: "active",
  },

  // ==========================================
  // 2. DETAILED OFFICE ASSETS (AST-IT / AST-MOB / etc.)
  // ==========================================
  {
    asset_no: "AST-IT-2026-001",
    category_name: "IT & Computing Hardware",
    asset_name: "MacBook Pro 16-inch M3 Max",
    brand: "Apple",
    model: "MBP 16 M3 Max 36GB",
    serial_number: "C02G1234MD6R",
    description: "Primary workstation for lead software engineer.",
    purchase_price: 349900.0,
    purchase_date: "2026-01-15",
    quantity: 1,
    vendor_name: "Imagine Apple Premium Reseller",
    invoice_number: "INV-2026-0891",
    image:
      "https://storage.cmmicrofinance.com/assets/images/macbook_pro_16.png",
    location: "Head Office - IT Dept (Floor 2)",
    condition_status: "new",
    status: "active",
    remarks: "Assigned to Lead Architect.",
  },
  {
    asset_no: "AST-IT-2026-002",
    category_name: "IT & Computing Hardware",
    asset_name: "Dell ThinkStation Workstation PC",
    brand: "Dell",
    model: "OptiPlex 7010 Tower",
    serial_number: "DELL-7010-88219",
    description: "Desktop PC setup for finance and accounts department.",
    purchase_price: 78000.0,
    purchase_date: "2025-11-10",
    quantity: 5,
    vendor_name: "Dell India Official Store",
    invoice_number: "INV-DEL-5512",
    image: "https://storage.cmmicrofinance.com/assets/images/dell_optiplex.png",
    location: "Head Office - Finance Desk",
    condition_status: "good",
    status: "active",
    remarks: "Configured with dual display setups.",
  },
  {
    asset_no: "AST-IT-2026-003",
    category_name: "IT & Computing Hardware",
    asset_name: "Rackmount Database Server",
    brand: "HPE",
    model: "ProLiant DL380 Gen10",
    serial_number: "HPE-DL380-99120",
    description: "On-premise primary database and backup server.",
    purchase_price: 520000.0,
    purchase_date: "2025-06-20",
    quantity: 1,
    vendor_name: "Redington India Ltd",
    invoice_number: "RED-SERVER-0041",
    image: "https://storage.cmmicrofinance.com/assets/images/hpe_server.png",
    location: "Server Room - Rack A",
    condition_status: "good",
    status: "active",
    remarks: "Maintained under annual AMC contract.",
  },
  {
    asset_no: "AST-IT-2026-004",
    category_name: "IT & Computing Hardware",
    asset_name: "Ubiquiti UniFi Managed Network Switch",
    brand: "Ubiquiti",
    model: "USW-Pro-48-POE",
    serial_number: "UBI-48POE-3341",
    description: "48-Port Power over Ethernet switch for office network.",
    purchase_price: 95000.0,
    purchase_date: "2025-08-05",
    quantity: 2,
    vendor_name: "Network Solutions Pvt Ltd",
    invoice_number: "NET-INV-882",
    image:
      "https://storage.cmmicrofinance.com/assets/images/ubiquiti_switch.png",
    location: "Server Room - Network Rack",
    condition_status: "good",
    status: "active",
    remarks: "Powers IP phones and CCTV cameras.",
  },
  {
    asset_no: "AST-MOB-2026-001",
    category_name: "Mobile Devices & Tablets",
    asset_name: "Samsung Galaxy Tab A9+ (Field Collection)",
    brand: "Samsung",
    model: "Galaxy Tab A9+ LTE",
    serial_number: "R52X1234567Y",
    description:
      "Tablets assigned to field collection agents for daily EMI tracking.",
    purchase_price: 22000.0,
    purchase_date: "2026-02-01",
    quantity: 15,
    vendor_name: "Reliance Digital",
    invoice_number: "RD-TAB-9012",
    image: "https://storage.cmmicrofinance.com/assets/images/galaxy_tab.png",
    location: "Field Branch 1 - Koramangala",
    condition_status: "new",
    status: "active",
    remarks: "Pre-installed with field collection application.",
  },
  {
    asset_no: "AST-ELC-2026-001",
    category_name: "Office Electronics & Appliances",
    asset_name: "Epson Heavy Duty Multi-Function Printer",
    brand: "Epson",
    model: "EcoTank L15150",
    serial_number: "EPS-L15150-7711",
    description: "High-volume duplex printer, scanner, and copier.",
    purchase_price: 82000.0,
    purchase_date: "2025-09-12",
    quantity: 2,
    vendor_name: "Croma Electronics",
    invoice_number: "CRO-PRN-4420",
    image: "https://storage.cmmicrofinance.com/assets/images/epson_printer.png",
    location: "Main Office - Documentation Hub",
    condition_status: "good",
    status: "active",
    remarks: "Connected to local network via ethernet.",
  },
  {
    asset_no: "AST-ELC-2026-002",
    category_name: "Office Electronics & Appliances",
    asset_name: "Daikin 2.0 Ton Inverter Split Air Conditioner",
    brand: "Daikin",
    model: "FTKG60TV",
    serial_number: "DAI-AC-883912",
    description: "Split AC units installed for core hall cooling.",
    purchase_price: 64000.0,
    purchase_date: "2025-04-10",
    quantity: 4,
    vendor_name: "Girias Electronics",
    invoice_number: "GIR-AC-1029",
    image: "https://storage.cmmicrofinance.com/assets/images/daikin_ac.png",
    location: "Head Office - Main Workstation Area",
    condition_status: "good",
    status: "active",
    remarks: "Serviced quarterly under maintenance plan.",
  },
  {
    asset_no: "AST-ELC-2026-003",
    category_name: "Office Electronics & Appliances",
    asset_name: "BenQ 4K Conference Room Projector",
    brand: "BenQ",
    model: "TK850i",
    serial_number: "BNQ-PRJ-3021",
    description: "Smart UHD projector for boardroom presentations.",
    purchase_price: 135000.0,
    purchase_date: "2025-03-18",
    quantity: 1,
    vendor_name: "Vijay Sales",
    invoice_number: "VS-BENQ-8801",
    image:
      "https://storage.cmmicrofinance.com/assets/images/benq_projector.png",
    location: "Boardroom - Ceiling Mount",
    condition_status: "good",
    status: "active",
    remarks: "Includes wireless casting dongle.",
  },
  {
    asset_no: "AST-FUR-2026-001",
    category_name: "Office Furniture & Fixtures",
    asset_name: "Featherlite Executive Mesh Chairs",
    brand: "Featherlite",
    model: "Helix High Back",
    serial_number: "FL-HLX-SET10",
    description: "Ergonomic mesh chairs for management and admin personnel.",
    purchase_price: 14500.0,
    purchase_date: "2025-02-14",
    quantity: 20,
    vendor_name: "Featherlite Official Experience Center",
    invoice_number: "FL-INV-7721",
    image:
      "https://storage.cmmicrofinance.com/assets/images/featherlite_chair.png",
    location: "Managerial Cabins & Staff Workstations",
    condition_status: "good",
    status: "active",
    remarks: "Includes 3-year manufacturer warranty.",
  },
  {
    asset_no: "AST-FUR-2026-002",
    category_name: "Office Furniture & Fixtures",
    asset_name: "Modular 12-Person Boardroom Table",
    brand: "Godrej Interio",
    model: "Conference-Pro 12",
    serial_number: "GI-CONF-12P",
    description:
      "Teak finish wooden conference table with built-in power sockets.",
    purchase_price: 180000.0,
    purchase_date: "2024-11-05",
    quantity: 1,
    vendor_name: "Godrej Interio Showroom",
    invoice_number: "GI-2024-9901",
    image: "https://storage.cmmicrofinance.com/assets/images/godrej_table.png",
    location: "Boardroom",
    condition_status: "good",
    status: "active",
    remarks: "Includes cable management pop-up boxes.",
  },
  {
    asset_no: "AST-FUR-2026-003",
    category_name: "Office Furniture & Fixtures",
    asset_name: "Fireproof Document Storage Safe Cabinet",
    brand: "Godrej Security",
    model: "Defender Prime 42",
    serial_number: "GOD-SAFE-9921",
    description:
      "Heavy-duty fire-resistant safe for storing physical loan agreements.",
    purchase_price: 115000.0,
    purchase_date: "2024-08-20",
    quantity: 2,
    vendor_name: "Godrej & Boyce Mfg Co",
    invoice_number: "GB-SAFE-4421",
    image: "https://storage.cmmicrofinance.com/assets/images/godrej_safe.png",
    location: "Records Vault Room",
    condition_status: "good",
    status: "active",
    remarks: "Dual key and digital combination lock.",
  },
  {
    asset_no: "AST-VEH-2026-001",
    category_name: "Vehicles & Transport",
    asset_name: "Maruti Suzuki Swift (Field Operations)",
    brand: "Maruti Suzuki",
    model: "Swift VXi",
    serial_number: "VIN-KA01MA123456",
    description: "Branch manager vehicle for field audits and regional visits.",
    purchase_price: 750000.0,
    purchase_date: "2024-05-10",
    quantity: 1,
    vendor_name: "Mandovi Motors",
    invoice_number: "MM-SWIFT-2024",
    image: "https://storage.cmmicrofinance.com/assets/images/maruti_swift.png",
    location: "Head Office Parking",
    condition_status: "good",
    status: "active",
    remarks: "Comprehensive insurance policy active.",
  },
  {
    asset_no: "AST-VEH-2026-002",
    category_name: "Vehicles & Transport",
    asset_name: "Hero Splendor Plus (Collection Bike)",
    brand: "Hero MotoCorp",
    model: "Splendor+ i3S",
    serial_number: "VIN-KA01HE98765",
    description: "Field collection motorcycles for daily loan collection runs.",
    purchase_price: 85000.0,
    purchase_date: "2025-01-12",
    quantity: 4,
    vendor_name: "Sai Hero Dealers",
    invoice_number: "SH-BIKE-3312",
    image: "https://storage.cmmicrofinance.com/assets/images/hero_splendor.png",
    location: "Branch 2 - Market Area",
    condition_status: "good",
    status: "active",
    remarks: "Assigned to Senior Collection Officers.",
  },
  {
    asset_no: "AST-SEC-2026-001",
    category_name: "Security & Surveillance Systems",
    asset_name: "Hikvision 16-Channel 4K CCTV Camera Kit",
    brand: "Hikvision",
    model: "DS-7616NI-K2 / 16P",
    serial_number: "HIK-NVR-16CH-991",
    description:
      "Surveillance NVR setup with 16 Dome and Bullet Cameras + 8TB HDD.",
    purchase_price: 110000.0,
    purchase_date: "2025-04-05",
    quantity: 1,
    vendor_name: "Secure Eye Solutions",
    invoice_number: "SES-CCTV-0021",
    image:
      "https://storage.cmmicrofinance.com/assets/images/hikvision_cctv.png",
    location: "Server Room - Monitor Wall",
    condition_status: "good",
    status: "active",
    remarks: "24/7 continuous recording setup.",
  },
  {
    asset_no: "AST-SEC-2026-002",
    category_name: "Security & Surveillance Systems",
    asset_name: "eSSL Biometric Attendance & Door Access System",
    brand: "eSSL",
    model: "X990 Access Terminal",
    serial_number: "ESSL-X990-2025",
    description: "Fingerprint and face recognition access control units.",
    purchase_price: 28000.0,
    purchase_date: "2025-02-18",
    quantity: 3,
    vendor_name: "Secure Eye Solutions",
    invoice_number: "SES-BIO-0112",
    image:
      "https://storage.cmmicrofinance.com/assets/images/essl_biometric.png",
    location: "Main Entrance & Server Room Doors",
    condition_status: "good",
    status: "active",
    remarks: "Integrated with HR attendance system.",
  },
  {
    asset_no: "AST-MAC-2026-001",
    category_name: "Plant & Machinery",
    asset_name: "Kirloskar 25 kVA Diesel Generator Set",
    brand: "Kirloskar",
    model: "KG1-25WS",
    serial_number: "KIR-GEN-25KVA-88",
    description:
      "Silent canopy diesel generator for uninterrupted office power.",
    purchase_price: 380000.0,
    purchase_date: "2024-12-01",
    quantity: 1,
    vendor_name: "Kirloskar Oil Engines Ltd",
    invoice_number: "KIR-INV-5510",
    image: "https://storage.cmmicrofinance.com/assets/images/kirloskar_gen.png",
    location: "Ground Floor - Generator Yard",
    condition_status: "good",
    status: "active",
    remarks: "Equipped with automatic transfer switch.",
  },
  {
    asset_no: "AST-MAC-2026-002",
    category_name: "Plant & Machinery",
    asset_name: "APC 10kVA Online UPS Power Backup",
    brand: "APC Schneider",
    model: "SRT10KXLI",
    serial_number: "APC-UPS-10KVA-321",
    description:
      "Uninterrupted power supply for core server room and switches.",
    purchase_price: 210000.0,
    purchase_date: "2024-09-15",
    quantity: 2,
    vendor_name: "Schneider Electric India",
    invoice_number: "SE-UPS-8812",
    image: "https://storage.cmmicrofinance.com/assets/images/apc_ups.png",
    location: "Server Room - Battery Bank",
    condition_status: "good",
    status: "active",
    remarks: "Includes external battery bank extension.",
  },
  {
    asset_no: "AST-FIN-2026-001",
    category_name: "Cash & Financial Assets",
    asset_name: "Kores High-Speed Currency Counting Machine",
    brand: "Kores",
    model: "Count-Easy 88",
    serial_number: "KOR-CNT-2025-99",
    description: "Banknote counter with UV/MG counterfeit detection.",
    purchase_price: 32000.0,
    purchase_date: "2025-05-22",
    quantity: 3,
    vendor_name: "Kores India Ltd",
    invoice_number: "KOR-INV-1102",
    image: "https://storage.cmmicrofinance.com/assets/images/kores_counter.png",
    location: "Cashier Counters 1, 2 & 3",
    condition_status: "good",
    status: "active",
    remarks: "Supports fake note alarm indicator.",
  },
  {
    asset_no: "AST-SOFT-2026-001",
    category_name: "Software & Intangibles",
    asset_name: "Microsoft 365 Business Premium License",
    brand: "Microsoft",
    model: "M365 Enterprise Subscription",
    serial_number: "MS-365-LIC-2026",
    description: "Annual enterprise productivity and email license suite.",
    purchase_price: 5400.0,
    purchase_date: "2026-01-01",
    quantity: 50,
    vendor_name: "SoftwareONE India",
    invoice_number: "SWO-MS-9012",
    image: "https://storage.cmmicrofinance.com/assets/images/m365_logo.png",
    location: "Cloud Digital Asset",
    condition_status: "new",
    status: "active",
    remarks: "Renews annually in January.",
  },
  {
    asset_no: "AST-PROP-2026-001",
    category_name: "Real Estate & Property",
    asset_name: "Branch Office Commercial Leasehold Property",
    brand: "N/A",
    model: "Commercial Building Space (3,500 sq.ft)",
    serial_number: "PROP-BLR-KOR-45A",
    description:
      "Leasehold interior fit-out and structural asset for head office.",
    purchase_price: 2500000.0,
    purchase_date: "2024-04-01",
    quantity: 1,
    vendor_name: "Koramangala Commercial Realty",
    invoice_number: "LEASE-2024-001",
    image:
      "https://storage.cmmicrofinance.com/assets/images/office_building.png",
    location: "Door No. 45/A, Koramangala, Bengaluru",
    condition_status: "good",
    status: "active",
    remarks: "10-year lease agreement.",
  },
];

export const SeedBusinessAssets = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(" ⏳ Seeding ALL 25 Business Asset records...");

    // 1. Get user ID for created_by
    const [users] = await connection.query("SELECT id FROM users LIMIT 1");
    const createdByUserId = users.length > 0 ? users[0].id : 1;

    // 2. Build category mapping
    const [categories] = await connection.query(
      "SELECT id, category_name FROM asset_categories",
    );
    const categoryMap = new Map();
    categories.forEach((cat) => {
      categoryMap.set(cat.category_name, cat.id);
    });

    const defaultCategoryId = categories.length > 0 ? categories[0].id : 1;

    for (const asset of ALL_BUSINESS_ASSETS) {
      await connection.beginTransaction();

      const categoryId =
        categoryMap.get(asset.category_name) || defaultCategoryId;

      const [existing] = await connection.query(
        `SELECT id FROM business_assets WHERE asset_no = ?`,
        [asset.asset_no],
      );

      if (existing.length === 0) {
        await connection.query(
          `
          INSERT INTO business_assets (
            asset_no, category_id, asset_name, brand, model, serial_number,
            description, purchase_price, purchase_date, quantity, vendor_name,
            invoice_number, image, location, condition_status, status, remarks, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            asset.asset_no,
            categoryId,
            asset.asset_name,
            asset.brand || null,
            asset.model || null,
            asset.serial_number || null,
            asset.description || null,
            asset.purchase_price,
            asset.purchase_date,
            asset.quantity || 1,
            asset.vendor_name || null,
            asset.invoice_number || null,
            asset.image || null,
            asset.location || null,
            asset.condition_status || "new",
            asset.status || "active",
            asset.remarks || null,
            createdByUserId,
          ],
        );
      } else {
        await connection.query(
          `
          UPDATE business_assets SET
            category_id = ?,
            asset_name = ?,
            brand = ?,
            model = ?,
            serial_number = ?,
            description = ?,
            purchase_price = ?,
            purchase_date = ?,
            quantity = ?,
            vendor_name = ?,
            invoice_number = ?,
            image = ?,
            location = ?,
            condition_status = ?,
            status = ?,
            remarks = ?,
            updated_by = ?
          WHERE id = ?
          `,
          [
            categoryId,
            asset.asset_name,
            asset.brand || null,
            asset.model || null,
            asset.serial_number || null,
            asset.description || null,
            asset.purchase_price,
            asset.purchase_date,
            asset.quantity || 1,
            asset.vendor_name || null,
            asset.invoice_number || null,
            asset.image || null,
            asset.location || null,
            asset.condition_status || "new",
            asset.status || "active",
            asset.remarks || null,
            createdByUserId,
            existing[0].id,
          ],
        );
      }

      await connection.commit();
    }

    console.log(" ✅ All 25 Business Asset records seeded successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding Business Assets:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
