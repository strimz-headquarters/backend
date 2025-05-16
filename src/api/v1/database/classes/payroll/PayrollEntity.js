const { parseUnits, ethers } = require("ethers");
const { Payroll, User, Plan } = require("../../models");
const {
  estimateGas,
  invokeFunction,
} = require("../../../controllers/contract/contract.controller");

class PayrollEntity {
  static getFrequencyIndex(frequency) {
    let index = 0;
    switch (frequency.toLowerCase()) {
      case "daily":
        index = 0;
        break;

      case "weekly":
        index = 1;
        break;
      case "monthly":
        index = 2;
        break;
      case "yearly":
        index = 3;
        break;

      default:
        break;
    }

    return index;
  }

  static async createPayroll(data) {
    try {
      const user = await User.findOne({
        where: {
          id: data.owner,
        },
      });

      if (!user) return { success: false };

      const args = [
        ethers.encodeBytes32String(data.name.toLowerCase().trim()),
        data.receipients.map((mp) => ({
          username: mp.name,
          amount: parseUnits(mp.amount.toString(), 6),
          _address: mp.address,
          valid: true,
        })),
        data.token,
        new Date(data.start_date).getTime(),
        this.getFrequencyIndex(data.frequency),
      ];

      // console.log({ args });
      await estimateGas("new_payroll", args, user.type, user.wallet.address);
      // console.log("fund receipt =====>>>>>> \n\n\n\n\n", fund_recipt);
      await invokeFunction("new_payroll", args, user.type, user);

      const newPayroll = await Payroll.create({
        ...data,
        name: data.name.toLowerCase().trim(),
      });

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
        // include: [
        //   {
        //     model: Plan,
        //     as: "current_plan",

        //     // as: "plan",
        //   },
        // ],
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
        // include: [
        //   {
        //     model: Plan,
        //     as: "current_plan",
        //   },
        // ],
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
