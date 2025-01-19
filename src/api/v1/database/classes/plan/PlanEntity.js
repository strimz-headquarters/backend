const { Plan } = require("../../models");

class PlanEntity {
  static async createPlan(data) {
    try {
      const newPlan = await Plan.create(data);

      return newPlan;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async updatePlan(uid, data) {
    try {
      const updatedPlan = await Plan.findByPk(uid);
      await updatedPlan.update(data);
      return updatedPlan;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async deletePlan(uid) {
    try {
      const deletedPlan = await Plan.findByPk(uid);
      await deletedPlan.destroy();
      return { success: true, message: "plan successfully deleted" };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getPlan(query) {
    try {
      const result = await Plan.findOne({
        where: query,
      });
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getPlans(page = 0, size = 100, query) {
    try {
      let query_construct = {};

      for (let i = 0; i < Object.keys(query).length; i++) {
        const element = Object.keys(query)[i];
        query_construct[element] = query[element];
      }

      const plans = await Plan.findAndCountAll({
        distinct: true,
        where: query_construct,
        limit: size,
        offset: page * size,
        order: [["createdAt", "DESC"]],
      });
      return plans;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = PlanEntity;
