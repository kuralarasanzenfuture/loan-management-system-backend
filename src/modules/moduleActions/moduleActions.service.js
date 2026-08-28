import ModuleActionModel from "./moduleActions.model.js";
import { getDB } from "../../config/db.js";

const ModuleActionService = {
  async assertLeafModule(moduleId) {
    const db = getDB();
    const [[module]] = await db.query(
      `SELECT id FROM modules WHERE id = ?`,
      [moduleId],
    );

    if (!module) {
      throw { status: 400, message: "Invalid module_id" };
    }

    const [[child]] = await db.query(
      `SELECT id FROM modules WHERE parent_id = ? LIMIT 1`,
      [moduleId],
    );

    if (child) {
      throw {
        status: 400,
        message: "Cannot assign actions to parent module. Use child module.",
      };
    }
  },

  async create(data) {
    await this.assertLeafModule(data.module_id);
    const id = await ModuleActionModel.create(data);

    return { message: "Module action created", id };
  },

  async getAll(filters) {
    return ModuleActionModel.findAll(filters);
  },

  async getByModule(module_id) {
    return ModuleActionModel.findByModule(module_id);
  },

  async getById(id) {
    const action = await ModuleActionModel.findById(id);

    if (!action) {
      throw { status: 404, message: "Action not found" };
    }

    return action;
  },

  async update(id, data) {
    const existing = await ModuleActionModel.findById(id);

    if (!existing) {
      throw { status: 404, message: "Action not found" };
    }

    if (data.module_id !== undefined) {
      await this.assertLeafModule(data.module_id);
    }

    await ModuleActionModel.update(id, data);

    return { message: "Updated" };
  },

  async toggleStatus(id) {
    const existing = await ModuleActionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Action not found" };
    }

    await ModuleActionModel.toggleStatus(id);

    return { message: "Status updated" };
  },

  async delete(id) {
    const existing = await ModuleActionModel.findById(id);
    if (!existing) {
      throw { status: 404, message: "Action not found" };
    }

    await ModuleActionModel.delete(id);

    return { message: "Deleted" };
  },

  async getTree() {
    const modules = await ModuleActionModel.getAllModules();
    const actions = await ModuleActionModel.getAllActions();

    // 🔥 map actions to module
    const actionMap = {};
    actions.forEach((a) => {
      if (!actionMap[a.module_id]) {
        actionMap[a.module_id] = [];
      }
      actionMap[a.module_id].push({
        id: a.id,
        code: a.action_code,
        name: a.action_name,
      });
    });

    // 🔥 build module map
    const moduleMap = {};
    modules.forEach((m) => {
      moduleMap[m.id] = {
        id: m.id,
        name: m.name,
        code: m.code,
        parent_id: m.parent_id,
        actions: actionMap[m.id] || [],
        children: [],
      };
    });

    // 🔥 build tree
    const tree = [];

    modules.forEach((m) => {
      if (m.parent_id) {
        moduleMap[m.parent_id]?.children.push(moduleMap[m.id]);
      } else {
        tree.push(moduleMap[m.id]);
      }
    });

    return tree;
  },

  async getFlat() {
    const modules = await ModuleActionModel.getAllModules();
    const actions = await ModuleActionModel.getAllActions();

    const moduleMap = {};

    // map modules
    modules.forEach((m) => {
      moduleMap[m.id] = {
        module_id: m.id,
        module_name: m.name,
        module_code: m.code,
        parent_id: m.parent_id,
        actions: [],
      };
    });

    // attach actions
    actions.forEach((a) => {
      if (moduleMap[a.module_id]) {
        moduleMap[a.module_id].actions.push({
          action_id: a.id,
          action_code: a.action_code,
          action_name: a.action_name,
        });
      }
    });

    // 🔥 flatten it properly
    const flat = [];

    Object.values(moduleMap).forEach((m) => {
      if (m.actions.length === 0) {
        flat.push({
          ...m,
          action_id: null,
          action_code: null,
          action_name: null,
        });
      } else {
        m.actions.forEach((a) => {
          flat.push({
            module_id: m.module_id,
            module_name: m.module_name,
            module_code: m.module_code,
            parent_id: m.parent_id,
            action_id: a.action_id,
            action_code: a.action_code,
            action_name: a.action_name,
          });
        });
      }
    });

    return flat;
  },
};

export default ModuleActionService;
