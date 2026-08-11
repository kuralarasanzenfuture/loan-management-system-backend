import { getDB } from "../../config/db.js";

const COMPANY_BANKS_DATA = [
  {
    bank_name: "HDFC Bank",
    bank_code: "HDFC",
    branch_name: "MG Road Branch, Bengaluru",
    branch_code: "HDFC0000240",
    account_holder_name: "Acme Enterprises Pvt Ltd",
    account_number: "50200012345678",
    account_type: "current",
    ifsc_code: "HDFC0000240",
    micr_code: "560240002",
    swift_code: "HDFCINBBXXX",
    opening_balance: 1000000.0,
    current_balance: 2450000.5,
    upi_id: "acmeenterprises@hdfcbank",
    upi_qr_code: "https://storage.example.com/qr/hdfc_primary.png",
    account_purpose: "business",
    is_primary: true,
    is_collection_account: true,
    is_disbursement_account: true,
    status: "active",
    opened_date: "2021-04-01",
    remarks: "Primary operational and main collection account.",
  },
  {
    bank_name: "State Bank of India",
    bank_code: "SBI",
    branch_name: "Industrial Finance Branch",
    branch_code: "SBIN0004123",
    account_holder_name: "Acme Enterprises Pvt Ltd - Payroll",
    account_number: "39876543210",
    account_type: "current",
    ifsc_code: "SBIN0004123",
    micr_code: "560002015",
    swift_code: "SBININBB412",
    opening_balance: 250000.0,
    current_balance: 850000.0,
    upi_id: "acmepayroll@sbi",
    upi_qr_code: null,
    account_purpose: "salary",
    is_primary: false,
    is_collection_account: false,
    is_disbursement_account: true,
    status: "active",
    opened_date: "2021-06-15",
    remarks: "Dedicated account for employee salary disbursements.",
  },
  {
    bank_name: "ICICI Bank",
    bank_code: "ICICI",
    branch_name: "Koramangala Branch",
    branch_code: "ICIC0000104",
    account_holder_name: "Acme Enterprises Pvt Ltd",
    account_number: "010405012399",
    account_type: "cash_credit",
    ifsc_code: "ICIC0000104",
    micr_code: "560229004",
    swift_code: "ICICINBBXXX",
    opening_balance: 0.0,
    current_balance: -1500000.0,
    upi_id: null,
    upi_qr_code: null,
    account_purpose: "expenses",
    is_primary: false,
    is_collection_account: false,
    is_disbursement_account: false,
    status: "active",
    opened_date: "2022-01-10",
    remarks: "Cash credit limit account for operational working capital.",
  },
  {
    bank_name: "Axis Bank",
    bank_code: "AXIS",
    branch_name: "Indiranagar Branch",
    branch_code: "UTIB0000052",
    account_holder_name: "Acme Enterprises Collections",
    account_number: "921020054321876",
    account_type: "current",
    ifsc_code: "UTIB0000052",
    micr_code: "560211003",
    swift_code: "AXISINBBXXX",
    opening_balance: 500000.0,
    current_balance: 1200000.75,
    upi_id: "acmecollect@axisbank",
    upi_qr_code: "https://storage.example.com/qr/axis_collection.png",
    account_purpose: "collection",
    is_primary: false,
    is_collection_account: true,
    is_disbursement_account: false,
    status: "active",
    opened_date: "2022-08-01",
    remarks:
      "Secondary collection account for digital payments and gateway payouts.",
  },
  {
    bank_name: "Kotak Mahindra Bank",
    bank_code: "KOTAK",
    branch_name: "Jayanagar Branch",
    branch_code: "KKBK0008051",
    account_holder_name: "Acme Enterprises Reserve Fund",
    account_number: "8011223344",
    account_type: "savings",
    ifsc_code: "KKBK0008051",
    micr_code: "560485012",
    swift_code: "KKBKINBBXXX",
    opening_balance: 5000000.0,
    current_balance: 5250000.0,
    upi_id: null,
    upi_qr_code: null,
    account_purpose: "savings",
    is_primary: false,
    is_collection_account: false,
    is_disbursement_account: false,
    status: "active",
    opened_date: "2023-02-20",
    remarks: "Parked surplus funds earning interest.",
  },
];

export const SeedCompanyBanks = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(" ⏳ Seeding Company Banks...");

    // 1. Fetch valid company_id and user_id for foreign key constraints
    const [companies] = await connection.query(
      "SELECT id FROM company_details LIMIT 1",
    );
    if (companies.length === 0) {
      throw new Error("Cannot seed company_banks: No company details found.");
    }
    const companyId = companies[0].id;

    const [users] = await connection.query("SELECT id FROM users LIMIT 1");
    const createdByUserId = users.length > 0 ? users[0].id : 1;

    for (const bank of COMPANY_BANKS_DATA) {
      await connection.beginTransaction();

      // 2. Check if bank account already exists by account number and company_id
      const [existing] = await connection.query(
        `SELECT id FROM company_banks WHERE account_number = ? AND company_id = ?`,
        [bank.account_number, companyId],
      );

      if (existing.length === 0) {
        // Insert new bank record
        await connection.query(
          `
          INSERT INTO company_banks (
            company_id, bank_name, bank_code, branch_name, branch_code,
            account_holder_name, account_number, account_type, ifsc_code,
            micr_code, swift_code, opening_balance, current_balance,
            upi_id, upi_qr_code, account_purpose, is_primary,
            is_collection_account, is_disbursement_account, status,
            opened_date, remarks, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            companyId,
            bank.bank_name,
            bank.bank_code,
            bank.branch_name,
            bank.branch_code,
            bank.account_holder_name,
            bank.account_number,
            bank.account_type,
            bank.ifsc_code,
            bank.micr_code,
            bank.swift_code,
            bank.opening_balance,
            bank.current_balance,
            bank.upi_id,
            bank.upi_qr_code,
            bank.account_purpose,
            bank.is_primary,
            bank.is_collection_account,
            bank.is_disbursement_account,
            bank.status,
            bank.opened_date,
            bank.remarks,
            createdByUserId,
          ],
        );
      } else {
        // Update existing record
        await connection.query(
          `
          UPDATE company_banks SET
            bank_name = ?, bank_code = ?, branch_name = ?, branch_code = ?,
            account_holder_name = ?, account_type = ?, ifsc_code = ?,
            micr_code = ?, swift_code = ?, opening_balance = ?, current_balance = ?,
            upi_id = ?, upi_qr_code = ?, account_purpose = ?, is_primary = ?,
            is_collection_account = ?, is_disbursement_account = ?, status = ?,
            opened_date = ?, remarks = ?, updated_by = ?
          WHERE id = ?
          `,
          [
            bank.bank_name,
            bank.bank_code,
            bank.branch_name,
            bank.branch_code,
            bank.account_holder_name,
            bank.account_type,
            bank.ifsc_code,
            bank.micr_code,
            bank.swift_code,
            bank.opening_balance,
            bank.current_balance,
            bank.upi_id,
            bank.upi_qr_code,
            bank.account_purpose,
            bank.is_primary,
            bank.is_collection_account,
            bank.is_disbursement_account,
            bank.status,
            bank.opened_date,
            bank.remarks,
            createdByUserId,
            existing[0].id,
          ],
        );
      }

      await connection.commit();
    }

    console.log(" ✅ Company Banks seeded successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding Company Banks:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
