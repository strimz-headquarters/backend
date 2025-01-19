const { Payroll, Plan } = require("../../models");

class PayrollEntity {
  static async createPayroll(data) {
    try {
      const newPayroll = await Payroll.create(data);

      return newPayroll;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async updatePayroll(uid, data) {
    try {
      const updatedPayroll = await Payroll.findByPk(uid);
      await updatedPayroll.update(data);
      return updatedPayroll;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async deletePayroll(uid) {
    try {
      const deletedPayroll = await Payroll.findByPk(uid);
      await deletedPayroll.destroy();
      return { success: true, message: "payroll successfully deleted" };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getPayroll(query) {
    try {
      const result = await Payroll.findOne({
        where: query,
        include: [
          {
            model: Plan,
            as: "current_plan",

            // as: "plan",
          },
        ],
      });
      return result;
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  static async getUserPayrolls(page = 0, size = 100, query) {
    try {
      let query_construct = {};

      for (let i = 0; i < Object.keys(query).length; i++) {
        const element = Object.keys(query)[i];
        query_construct[element] = query[element];
      }

      const payrolls = await Payroll.findAndCountAll({
        distinct: true,
        where: query_construct,
        include: [
          {
            model: Plan,
            as: "current_plan",
          },
        ],
        limit: size,
        offset: page * size,
        order: [["createdAt", "DESC"]],
      });
      return payrolls;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = PayrollEntity;
