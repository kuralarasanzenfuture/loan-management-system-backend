import ModuleModel from "./modules.model.js";

const ModuleService = {
  async create(data) {
    if (data.parent_id !== null && data.parent_id !== undefined) {
      const parent = await ModuleModel.findById(data.parent_id);
      if (!parent) {
        throw { status: 400, message: "Parent module not found" };
      }
    }

    const id = await ModuleModel.create(data);

    return { message: "Module created", id };
  },

  async getAll(filters) {
    return ModuleModel.findAll(filters);
  },

  async getTree() {
    const modules = await ModuleModel.findAll();

    // 🔥 build tree
    const map = {};
    const roots = [];

    modules.forEach((m) => (map[m.id] = { ...m, children: [] }));

    modules.forEach((m) => {
      if (m.parent_id) {
        map[m.parent_id]?.children.push(map[m.id]);
      } else {
        roots.push(map[m.id]);
      }
    });

    return roots;
  },

  async getById(id) {
    const module = await ModuleModel.findById(id);
    if (!module) throw { status: 404, message: "Module not found" };
    return module;
  },

  async update(id, data) {
    const existing = await ModuleModel.findById(id);
    if (!existing) throw { status: 404, message: "Module not found" };

    if (data.parent_id !== undefined && data.parent_id !== null) {
      if (data.parent_id === id) {
        throw { status: 400, message: "Cannot set self as parent" };
      }

      const parent = await ModuleModel.findById(data.parent_id);
      if (!parent) {
        throw { status: 400, message: "Parent module not found" };
      }

      let ancestor = parent;
      while (ancestor.parent_id !== null) {
        if (ancestor.parent_id === id) {
          throw { status: 400, message: "Cannot set a child module as parent" };
        }
        ancestor = await ModuleModel.findById(ancestor.parent_id);
      }
    }

    await ModuleModel.update(id, data);

    return { message: "Updated" };
  },

  async toggleStatus(id) {
    const existing = await ModuleModel.findById(id);
    if (!existing) throw { status: 404, message: "Module not found" };

    await ModuleModel.toggleStatus(id);
    return { message: "Status updated" };
  },

  async delete(id) {
    const existing = await ModuleModel.findById(id);
    if (!existing) throw { status: 404, message: "Module not found" };

    await ModuleModel.delete(id);
    return { message: "Deleted" };
  },
};

export default ModuleService;
