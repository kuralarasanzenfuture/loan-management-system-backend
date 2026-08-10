import CompanyModel from "./companyDetails.model.js";

const CompanyService = {
  async create(data, user) {
    // 🔴 Only ONE company allowed (singleton)
    const existing = await CompanyModel.findOne();

    if (existing) {
      throw { status: 400, message: "Company already exists. Please edit the existing company." };
    }

    const id = await CompanyModel.create({
      ...data,
      created_by: user.id,
    });

    // Return the newly created record so the frontend Redux store is updated
    const company = await CompanyModel.findById(id);

    return {
      message: "Company created successfully",
      data: company,
    };
  },

  async get() {
    // Singleton: returns null when no company exists yet (first-time setup)
    const company = await CompanyModel.findOne();
    return company || null;
  },

  async getById(id) {
    if (!id) {
      throw { status: 400, message: "Company ID is required" };
    }

    const company = await CompanyModel.findById(id);

    if (!company) {
      throw { status: 404, message: "Company not found" };
    }

    return company;
  },

  async update(id, data, user) {
    const existing = await CompanyModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Company not found" };
    }

    await CompanyModel.update(id, {
      ...data,
      updated_by: user.id,
    });

    // Return the updated record so the frontend Redux store is updated
    const updated = await CompanyModel.findById(id);

    return {
      message: "Company updated successfully",
      data: updated,
    };
  },

  async delete(id) {
    const existing = await CompanyModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Company not found" };
    }

    await CompanyModel.delete(id);

    return { message: "Company deleted successfully" };
  },
};

export default CompanyService;
