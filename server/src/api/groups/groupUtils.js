import { ErrorHandler } from "../middlewares/errorHandler.js";

class GroupUtils {
  static assignRoles(members, admins, coadmins, inviterId, groupId) {
    return members.map((userId) => {
      const member = { "inviter_id": inviterId, "group_id": groupId, "member_id": userId, "deletedAt": null };

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
    const debtorShareTotal = parseFloat(debtors.reduce((acc, debtor) => {
      return acc + parseFloat(debtor.debtor_share);
    }, 0).toFixed(2));
    
    const calculatedTotalExpenseAmount = parseFloat(payerShare) + debtorShareTotal;

    switch (splitType) {
      case "EQUAL":
      case "UNEQUAL": {
        if (calculatedTotalExpenseAmount !== parseFloat(totalAmount)) {
          throw new ErrorHandler(400, "Expense shares of partcipants does not add up to total amount.");
        }
        const updatedDebtors = debtors.map((debtor) => ({ "debtor_id": debtor.debtor_id, "debtor_amount": debtor.debtor_share }));
        
        return updatedDebtors;
      }
      case "PERCENTAGE": {
        if (calculatedTotalExpenseAmount !== 100) {
          throw new ErrorHandler(400, "Expense shares of partcipants does not add up to 100%.");
        }
        const updatedDebtors = debtors.map((debtor) => ({ "debtor_id": debtor.debtor_id, "debtor_amount": (debtor.debtor_share * totalAmount) / 100 }));

        return updatedDebtors;
      }
      default: {
        throw new ErrorHandler(400, "Wrong split type.");
      }
    }
  };

  static validateSettlementAmount = (balanceAmount, settlementAmount) => {
    if (balanceAmount < 0 && -balanceAmount < settlementAmount || balanceAmount > 0 && balanceAmount < settlementAmount) {
      throw new ErrorHandler(400, "Settlement amount can't be more than balance amount.");
    }
  };

  static updateBalance = (participants, member, balanceAmount, payerId, isNewParticipants = false) => {
    let balance = balanceAmount;

    participants.forEach((participant) => {
      const debtorAmount = parseFloat(participant.debtor_amount);

      if (participant.debtor_id === member.participant1_id && payerId === member.participant2_id) {
        balance += isNewParticipants ? -debtorAmount : debtorAmount;
      } else if (payerId === member.participant1_id && participant.debtor_id === member.participant2_id) {
        balance += isNewParticipants ? debtorAmount : -debtorAmount;
      }
    });
    
    return balance;
  };
}

export default GroupUtils;
