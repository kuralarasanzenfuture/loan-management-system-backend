// import { getDB } from "../../config/db.js";

// // Sample Data Pools
// const MALE_NAMES = [
//   "Aarav",
//   "Vihaan",
//   "Aditya",
//   "Sai",
//   "Reyansh",
//   "Muhammad",
//   "Arjun",
//   "Kabir",
//   "Rohan",
//   "Ananya",
//   "Ishaan",
//   "Rudra",
//   "Ayaan",
//   "Dhruv",
//   "Vikram",
//   "Rahul",
//   "Suresh",
//   "Ramesh",
//   "Amit",
//   "Karan",
//   "Priya",
//   "Rajesh",
//   "Sunil",
//   "Manish",
// ];

// const FEMALE_NAMES = [
//   "Aadhya",
//   "Diya",
//   "Saanvi",
//   "Ananya",
//   "Pari",
//   "Anaya",
//   "Fatima",
//   "Aanya",
//   "Ira",
//   "Riya",
//   "Sneha",
//   "Pooja",
//   "Kavya",
//   "Neha",
//   "Priyanka",
//   "Shruti",
//   "Swati",
//   "Divya",
//   "Meera",
//   "Shreya",
//   "Sunita",
//   "Anita",
//   "Geeta",
//   "Kiran",
// ];

// const LAST_NAMES = [
//   "Sharma",
//   "Verma",
//   "Gupta",
//   "Patel",
//   "Kumar",
//   "Singh",
//   "Shah",
//   "Reddy",
//   "Rao",
//   "Joshi",
//   "Nair",
//   "Mehta",
//   "Deshmukh",
//   "Choudhury",
//   "Das",
//   "Banerjee",
//   "Mishra",
//   "Khan",
//   "Shaik",
//   "Kulkarni",
//   "Agarwal",
//   "Yadav",
// ];

// const CITIES = [
//   {
//     city: "Mumbai",
//     district: "Mumbai City",
//     state: "Maharashtra",
//     pincode: "400001",
//   },
//   {
//     city: "Bengaluru",
//     district: "Bengaluru Urban",
//     state: "Karnataka",
//     pincode: "560001",
//   },
//   {
//     city: "Delhi",
//     district: "Central Delhi",
//     state: "Delhi",
//     pincode: "110001",
//   },
//   {
//     city: "Hyderabad",
//     district: "Hyderabad",
//     state: "Telangana",
//     pincode: "500001",
//   },
//   {
//     city: "Chennai",
//     district: "Chennai",
//     state: "Tamil Nadu",
//     pincode: "600001",
//   },
//   {
//     city: "Kolkata",
//     district: "Kolkata",
//     state: "West Bengal",
//     pincode: "700001",
//   },
//   {
//     city: "Ahmedabad",
//     district: "Ahmedabad",
//     state: "Gujarat",
//     pincode: "380001",
//   },
//   { city: "Pune", district: "Pune", state: "Maharashtra", pincode: "411001" },
// ];

// const OCCUPATIONS = [
//   "Software Engineer",
//   "Teacher",
//   "Business Owner",
//   "Accountant",
//   "Bank Manager",
//   "Doctor",
//   "Civil Engineer",
//   "Sales Executive",
//   "Consultant",
//   "Graphic Designer",
// ];

// // Helper functions for random data generation
// const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const getRandomInt = (min, max) =>
//   Math.floor(Math.random() * (max - min + 1)) + min;

// const generateDigits = (length) => {
//   let result = "";
//   for (let i = 0; i < length; i++) {
//     result += Math.floor(Math.random() * 10).toString();
//   }
//   return result;
// };

// const generatePAN = () => {
//   const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//   let pan = "";
//   for (let i = 0; i < 3; i++) pan += letters[Math.floor(Math.random() * 26)];
//   pan += "P"; // Person category
//   pan += letters[Math.floor(Math.random() * 26)];
//   pan += generateDigits(4);
//   pan += letters[Math.floor(Math.random() * 26)];
//   return pan;
// };

// const generateDOB = () => {
//   const start = new Date(1975, 0, 1);
//   const end = new Date(2003, 11, 31);
//   const date = new Date(
//     start.getTime() + Math.random() * (end.getTime() - start.getTime()),
//   );
//   return date.toISOString().split("T")[0];
// };

// // Your provided sequence generator function
// async function generateCustomerNo(conn) {
//   const year = new Date().getFullYear();

//   const [rows] = await conn.query(
//     `
//     SELECT customer_no
//     FROM customers
//     WHERE customer_no LIKE ?
//     ORDER BY id DESC
//     LIMIT 1
//     FOR UPDATE
//     `,
//     [`CUS-${year}-%`],
//   );

//   let nextNumber = 1;

//   if (rows.length > 0) {
//     const lastNo = rows[0].customer_no;
//     const lastSeq = parseInt(lastNo.split("-")[2], 10);
//     nextNumber = lastSeq + 1;
//   }

//   const formatted = String(nextNumber).padStart(6, "0");
//   return `CUS-${year}-${formatted}`;
// }

// // Seed Execution
// async function seedCustomers() {
//   const pool = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "your_password",
//     database: "your_database",
//     waitForConnections: true,
//     connectionLimit: 10,
//   });

//   const connection = await pool.getConnection();

//   try {
//     console.log("Starting seed of 100 customers...");

//     for (let i = 0; i < 100; i++) {
//       // Begin transaction to ensure FOR UPDATE lock works correctly per customer number generation
//       await connection.beginTransaction();

//       const gender = i % 2 === 0 ? "male" : "female";
//       const firstName =
//         gender === "male"
//           ? getRandomElement(MALE_NAMES)
//           : getRandomElement(FEMALE_NAMES);
//       const lastName = getRandomElement(LAST_NAMES);
//       const fatherName = `${getRandomElement(MALE_NAMES)} ${lastName}`;
//       const motherName = `${getRandomElement(FEMALE_NAMES)} ${lastName}`;

//       const location = getRandomElement(CITIES);
//       const customerNo = await generateCustomerNo(connection);

//       const customerData = [
//         customerNo,
//         firstName,
//         lastName,
//         fatherName,
//         motherName,
//         `9${generateDigits(9)}`, // mobile (10 digits starting with 9)
//         `8${generateDigits(9)}`, // alternate_mobile
//         generateDigits(12), // aadhaar_no
//         generatePAN(), // pan_no
//         generateDOB(), // dob
//         gender, // gender
//         getRandomElement(OCCUPATIONS), // occupation
//         getRandomInt(250, 1500) * 100, // monthly_income (25,000 to 1,500,000)
//         `Flat ${getRandomInt(101, 999)}, ${getRandomElement(["MG Road", "Station Road", "Main Street", "Park Avenue"])}`, // address
//         location.city,
//         location.district,
//         location.state,
//         location.pincode,
//         `photos/${gender}_${i + 1}.jpg`, // photo
//         `${getRandomElement(MALE_NAMES)} ${lastName}`, // reference_name
//         `7${generateDigits(9)}`, // reference_mobile
//         "Auto-generated customer seed record.", // remarks
//         "active", // status
//         null, // created_by
//       ];

//       const query = `
//         INSERT INTO customers (
//           customer_no, first_name, last_name, father_name, mother_name,
//           mobile, alternate_mobile, aadhaar_no, pan_no, dob, gender,
//           occupation, monthly_income, address, city, district, state,
//           pincode, photo, reference_name, reference_mobile, remarks, status, created_by
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;

//       await connection.query(query, customerData);
//       await connection.commit();

//       if ((i + 1) % 10 === 0) {
//         console.log(`Inserted ${i + 1}/100 customers...`);
//       }
//     }

//     console.log("Successfully inserted 100 customers!");
//   } catch (error) {
//     await connection.rollback();
//     console.error("Error seeding customers:", error);
//   } finally {
//     connection.release();
//     await pool.end();
//   }
// }

// export { seedCustomers };

import { getDB } from "../../config/db.js";

// Sample Data Pools
const MALE_NAMES = [
  "Aarav",
  "Vihaan",
  "Aditya",
  "Sai",
  "Reyansh",
  "Muhammad",
  "Arjun",
  "Kabir",
  "Rohan",
  "Ananya",
  "Ishaan",
  "Rudra",
  "Ayaan",
  "Dhruv",
  "Vikram",
  "Rahul",
  "Suresh",
  "Ramesh",
  "Amit",
  "Karan",
  "Priya",
  "Rajesh",
  "Sunil",
  "Manish",
];

const FEMALE_NAMES = [
  "Aadhya",
  "Diya",
  "Saanvi",
  "Ananya",
  "Pari",
  "Anaya",
  "Fatima",
  "Aanya",
  "Ira",
  "Riya",
  "Sneha",
  "Pooja",
  "Kavya",
  "Neha",
  "Priyanka",
  "Shruti",
  "Swati",
  "Divya",
  "Meera",
  "Shreya",
  "Sunita",
  "Anita",
  "Geeta",
  "Kiran",
];

const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Patel",
  "Kumar",
  "Singh",
  "Shah",
  "Reddy",
  "Rao",
  "Joshi",
  "Nair",
  "Mehta",
  "Deshmukh",
  "Choudhury",
  "Das",
  "Banerjee",
  "Mishra",
  "Khan",
  "Shaik",
  "Kulkarni",
  "Agarwal",
  "Yadav",
];

const CITIES = [
  {
    city: "Mumbai",
    district: "Mumbai City",
    state: "Maharashtra",
    pincode: "400001",
  },
  {
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    pincode: "560001",
  },
  {
    city: "Delhi",
    district: "Central Delhi",
    state: "Delhi",
    pincode: "110001",
  },
  {
    city: "Hyderabad",
    district: "Hyderabad",
    state: "Telangana",
    pincode: "500001",
  },
  {
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
  },
  {
    city: "Kolkata",
    district: "Kolkata",
    state: "West Bengal",
    pincode: "700001",
  },
  {
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
  },
  { city: "Pune", district: "Pune", state: "Maharashtra", pincode: "411001" },
];

const OCCUPATIONS = [
  "Software Engineer",
  "Teacher",
  "Business Owner",
  "Accountant",
  "Bank Manager",
  "Doctor",
  "Civil Engineer",
  "Sales Executive",
  "Consultant",
  "Graphic Designer",
];

// Sets to track unique fields in-memory during generation
const generatedMobiles = new Set();
const generatedAadhaars = new Set();
const generatedPANs = new Set();

// Helper functions for random data generation
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateDigits = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
};

const generateUniqueMobile = (prefix) => {
  let mobile;
  do {
    mobile = `${prefix}${generateDigits(9)}`;
  } while (generatedMobiles.has(mobile));
  generatedMobiles.add(mobile);
  return mobile;
};

const generateUniqueAadhaar = () => {
  let aadhaar;
  do {
    aadhaar = generateDigits(12);
  } while (generatedAadhaars.has(aadhaar));
  generatedAadhaars.add(aadhaar);
  return aadhaar;
};

const generateUniquePAN = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let pan;
  do {
    let result = "";
    for (let i = 0; i < 3; i++)
      result += letters[Math.floor(Math.random() * 26)];
    result += "P"; // Person category
    result += letters[Math.floor(Math.random() * 26)];
    result += generateDigits(4);
    result += letters[Math.floor(Math.random() * 26)];
    pan = result;
  } while (generatedPANs.has(pan));
  generatedPANs.add(pan);
  return pan;
};

const generateDOB = () => {
  const start = new Date(1975, 0, 1);
  const end = new Date(2003, 11, 31);
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
  return date.toISOString().split("T")[0];
};

// Sequence generator function
async function generateCustomerNo(conn) {
  const year = new Date().getFullYear();

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
    const lastNo = rows[0].customer_no;
    const lastSeq = parseInt(lastNo.split("-")[2], 10);
    nextNumber = lastSeq + 1;
  }

  const formatted = String(nextNumber).padStart(6, "0");
  return `CUS-${year}-${formatted}`;
}

// Seed Execution Exported for runSeeds.js
export const SeedCustomers = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log("  ⏳ Seeding 100 customers (50 male / 50 female)...");

    for (let i = 0; i < 100; i++) {
      // Begin transaction to ensure FOR UPDATE lock works safely per customer insert
      await connection.beginTransaction();

      const gender = i % 2 === 0 ? "male" : "female";
      const firstName =
        gender === "male"
          ? getRandomElement(MALE_NAMES)
          : getRandomElement(FEMALE_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const fatherName = `${getRandomElement(MALE_NAMES)} ${lastName}`;
      const motherName = `${getRandomElement(FEMALE_NAMES)} ${lastName}`;

      const location = getRandomElement(CITIES);
      const customerNo = await generateCustomerNo(connection);

      const customerData = [
        customerNo,
        firstName,
        lastName,
        fatherName,
        motherName,
        generateUniqueMobile("9"), // mobile (10 digits starting with 9)
        generateUniqueMobile("8"), // alternate_mobile
        generateUniqueAadhaar(), // aadhaar_no
        generateUniquePAN(), // pan_no
        generateDOB(), // dob
        gender, // gender
        getRandomElement(OCCUPATIONS), // occupation
        getRandomInt(250, 1500) * 100, // monthly_income (25,000 to 150,000)
        `Flat ${getRandomInt(101, 999)}, ${getRandomElement(["MG Road", "Station Road", "Main Street", "Park Avenue"])}`, // address
        location.city,
        location.district,
        location.state,
        location.pincode,
        `photos/${gender}_${i + 1}.jpg`, // photo
        `${getRandomElement(MALE_NAMES)} ${lastName}`, // reference_name
        generateUniqueMobile("7"), // reference_mobile
        "Auto-generated customer seed record.", // remarks
        "active", // status
        null, // created_by
      ];

      const query = `
        INSERT INTO customers (
          customer_no, first_name, last_name, father_name, mother_name,
          mobile, alternate_mobile, aadhaar_no, pan_no, dob, gender,
          occupation, monthly_income, address, city, district, state,
          pincode, photo, reference_name, reference_mobile, remarks, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.query(query, customerData);
      await connection.commit();
    }

    console.log("  ✅ 100 customers seeded successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding customers:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
