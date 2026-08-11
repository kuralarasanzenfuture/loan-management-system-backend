import { getDB } from "../../config/db.js";

const COMPANY_DETAILS_DATA = {
  company_name: "CM Micro Finance Pvt Ltd",
  legal_name: "CM Micro Finance Private Limited",
  trade_name: "CM Micro Finance",
  business_type: "private_limited",
  business_description:
    "Providing micro-loans, daily market trader finance, and flexible business growth loans to small enterprises.",
  establishment_date: "2018-05-15",

  // Registration Identifiers
  gst_number: "29AABCC1234D1Z5",
  pan_number: "AABCC1234D",

  // Contact
  phone: "+91 98765 43210",
  alternate_phone: "+91 80 2345 6789",
  email: "support@cmmicrofinance.com",
  alternate_email: "info@cmmicrofinance.com",
  website: "https://www.cmmicrofinance.com",

  // Address
  address_line_1: "Door No. 45/A, 2nd Floor, Main Road",
  address_line_2: "Near Bus Terminal, Koramangala",
  landmark: "Opposite Town Hall",
  city: "Bengaluru",
  taluk: "Bengaluru South",
  district: "Bengaluru Urban",
  state: "Karnataka",
  state_code: "29",
  country: "India",
  pincode: "560034",
  latitude: 12.935242,
  longitude: 77.624462,

  // Business Hours
  business_start_time: "09:00:00",
  business_end_time: "18:00:00",
  working_days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
  weekly_off_day: "Sunday",
  timezone: "Asia/Kolkata",

  // Branding
  logo: "https://storage.cmmicrofinance.com/assets/logo.png",
  favicon: "https://storage.cmmicrofinance.com/assets/favicon.ico",
  stamp_image: "https://storage.cmmicrofinance.com/assets/official_stamp.png",
  signature_image: "https://storage.cmmicrofinance.com/assets/director_sig.png",

  // Social
  facebook_url: "https://facebook.com/cmmicrofinance",
  instagram_url: "https://instagram.com/cmmicrofinance",
  youtube_url: "https://youtube.com/@cmmicrofinance",
  whatsapp_number: "+919876543210",

  status: "active",
};

export const SeedCompanyDetails = async () => {
  const db = getDB();
  const connection = await db.getConnection();

  try {
    console.log(" ⏳ Seeding Company Details for CM Micro Finance...");

    // 1. Fetch fallback created_by user ID
    const [users] = await connection.query("SELECT id FROM users LIMIT 1");
    const createdByUserId = users.length > 0 ? users[0].id : 1;

    await connection.beginTransaction();

    // 2. Check if company details already exist (ensures single company record)
    const [existing] = await connection.query(
      `SELECT id FROM company_details LIMIT 1`,
    );

    if (existing.length === 0) {
      // Insert single company entry
      await connection.query(
        `
        INSERT INTO company_details (
          company_name, legal_name, trade_name, business_type,
          business_description, establishment_date, gst_number, pan_number,
          phone, alternate_phone, email, alternate_email, website,
          address_line_1, address_line_2, landmark, city, taluk, district,
          state, state_code, country, pincode, latitude, longitude,
          business_start_time, business_end_time, working_days, weekly_off_day, timezone,
          logo, favicon, stamp_image, signature_image,
          facebook_url, instagram_url, youtube_url, whatsapp_number,
          status, created_by
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?
        )
        `,
        [
          COMPANY_DETAILS_DATA.company_name,
          COMPANY_DETAILS_DATA.legal_name,
          COMPANY_DETAILS_DATA.trade_name,
          COMPANY_DETAILS_DATA.business_type,
          COMPANY_DETAILS_DATA.business_description,
          COMPANY_DETAILS_DATA.establishment_date,
          COMPANY_DETAILS_DATA.gst_number,
          COMPANY_DETAILS_DATA.pan_number,
          COMPANY_DETAILS_DATA.phone,
          COMPANY_DETAILS_DATA.alternate_phone,
          COMPANY_DETAILS_DATA.email,
          COMPANY_DETAILS_DATA.alternate_email,
          COMPANY_DETAILS_DATA.website,
          COMPANY_DETAILS_DATA.address_line_1,
          COMPANY_DETAILS_DATA.address_line_2,
          COMPANY_DETAILS_DATA.landmark,
          COMPANY_DETAILS_DATA.city,
          COMPANY_DETAILS_DATA.taluk,
          COMPANY_DETAILS_DATA.district,
          COMPANY_DETAILS_DATA.state,
          COMPANY_DETAILS_DATA.state_code,
          COMPANY_DETAILS_DATA.country,
          COMPANY_DETAILS_DATA.pincode,
          COMPANY_DETAILS_DATA.latitude,
          COMPANY_DETAILS_DATA.longitude,
          COMPANY_DETAILS_DATA.business_start_time,
          COMPANY_DETAILS_DATA.business_end_time,
          COMPANY_DETAILS_DATA.working_days,
          COMPANY_DETAILS_DATA.weekly_off_day,
          COMPANY_DETAILS_DATA.timezone,
          COMPANY_DETAILS_DATA.logo,
          COMPANY_DETAILS_DATA.favicon,
          COMPANY_DETAILS_DATA.stamp_image,
          COMPANY_DETAILS_DATA.signature_image,
          COMPANY_DETAILS_DATA.facebook_url,
          COMPANY_DETAILS_DATA.instagram_url,
          COMPANY_DETAILS_DATA.youtube_url,
          COMPANY_DETAILS_DATA.whatsapp_number,
          COMPANY_DETAILS_DATA.status,
          createdByUserId,
        ],
      );
      console.log("  ✓ Inserted CM Micro Finance company details.");
    } else {
      // Update existing single company record
      const companyId = existing[0].id;
      await connection.query(
        `
        UPDATE company_details SET
          company_name = ?, legal_name = ?, trade_name = ?, business_type = ?,
          business_description = ?, establishment_date = ?, gst_number = ?, pan_number = ?,
          phone = ?, alternate_phone = ?, email = ?, alternate_email = ?, website = ?,
          address_line_1 = ?, address_line_2 = ?, landmark = ?, city = ?, taluk = ?, district = ?,
          state = ?, state_code = ?, country = ?, pincode = ?, latitude = ?, longitude = ?,
          business_start_time = ?, business_end_time = ?, working_days = ?, weekly_off_day = ?, timezone = ?,
          logo = ?, favicon = ?, stamp_image = ?, signature_image = ?,
          facebook_url = ?, instagram_url = ?, youtube_url = ?, whatsapp_number = ?,
          status = ?, updated_by = ?
        WHERE id = ?
        `,
        [
          COMPANY_DETAILS_DATA.company_name,
          COMPANY_DETAILS_DATA.legal_name,
          COMPANY_DETAILS_DATA.trade_name,
          COMPANY_DETAILS_DATA.business_type,
          COMPANY_DETAILS_DATA.business_description,
          COMPANY_DETAILS_DATA.establishment_date,
          COMPANY_DETAILS_DATA.gst_number,
          COMPANY_DETAILS_DATA.pan_number,
          COMPANY_DETAILS_DATA.phone,
          COMPANY_DETAILS_DATA.alternate_phone,
          COMPANY_DETAILS_DATA.email,
          COMPANY_DETAILS_DATA.alternate_email,
          COMPANY_DETAILS_DATA.website,
          COMPANY_DETAILS_DATA.address_line_1,
          COMPANY_DETAILS_DATA.address_line_2,
          COMPANY_DETAILS_DATA.landmark,
          COMPANY_DETAILS_DATA.city,
          COMPANY_DETAILS_DATA.taluk,
          COMPANY_DETAILS_DATA.district,
          COMPANY_DETAILS_DATA.state,
          COMPANY_DETAILS_DATA.state_code,
          COMPANY_DETAILS_DATA.country,
          COMPANY_DETAILS_DATA.pincode,
          COMPANY_DETAILS_DATA.latitude,
          COMPANY_DETAILS_DATA.longitude,
          COMPANY_DETAILS_DATA.business_start_time,
          COMPANY_DETAILS_DATA.business_end_time,
          COMPANY_DETAILS_DATA.working_days,
          COMPANY_DETAILS_DATA.weekly_off_day,
          COMPANY_DETAILS_DATA.timezone,
          COMPANY_DETAILS_DATA.logo,
          COMPANY_DETAILS_DATA.favicon,
          COMPANY_DETAILS_DATA.stamp_image,
          COMPANY_DETAILS_DATA.signature_image,
          COMPANY_DETAILS_DATA.facebook_url,
          COMPANY_DETAILS_DATA.instagram_url,
          COMPANY_DETAILS_DATA.youtube_url,
          COMPANY_DETAILS_DATA.whatsapp_number,
          COMPANY_DETAILS_DATA.status,
          createdByUserId,
          companyId,
        ],
      );
      console.log("  ✓ Updated CM Micro Finance company details.");
    }

    await connection.commit();
    console.log(" ✅ Company Details seeded successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error seeding Company Details:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};
