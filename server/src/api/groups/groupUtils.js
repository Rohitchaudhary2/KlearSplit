import { ErrorHandler } from "../middlewares/errorHandler.js";

class GroupUtils {
  static assignRoles(members, admins, coadmins, inviterId, groupId) {
    return members.map((userId) => {
      const member = { "inviter_id": inviterId, "group_id": groupId, "member_id": userId };

      if (admins && admins.includes(userId)) {
        member.role = "ADMIN";
      } else if (coadmins && coadmins.includes(userId)) {
        member.role = "COADMIN";
      }
      
      return member;
    });
  }

  static isPayerInDebtors = (debtors, payerId) => {
    const isPayerInDebtors = debtors.some((debtor) => debtor.debtor_id === payerId);

    if (isPayerInDebtors) {
      throw new ErrorHandler(400, "Payer can't be in debtor list.");
    }
  };

  static updatedDebtors = (debtors, splitType, totalAmount, payerShare) => {
    const debtorShareTotal = debtors.reduce((acc, val) => {
      return acc + val;
    }, 0);
    const calculatedTotalExpenseAmount = payerShare + debtorShareTotal;

    switch (splitType) {
      case "EQUAL":
      case "UNEQUAL": {
        if (calculatedTotalExpenseAmount !== totalAmount) {
          throw new ErrorHandler(400, "Expense shares of partcipants does not add up to total amount.");
        }
        return debtors;
      }
      case "PERCENTAGE": {
        if (calculatedTotalExpenseAmount !== 100) {
          throw new ErrorHandler(400, "Expense shares of partcipants does not add up to 100%.");
        }
        debtors.forEach((debtor) => Object.assign(debtor, { "debtor_amount": (debtor.debtor_share * totalAmount) / 100 }));

        return debtors;
      }
      default: {
        throw new ErrorHandler(400, "Wrong split type.");
      }
    }
  };
}

export default GroupUtils;
