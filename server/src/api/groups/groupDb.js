import { Op, QueryTypes } from "sequelize";
import { Group, GroupExpense, GroupExpenseParticipant, GroupMember, GroupMemberBalance, GroupMessage, GroupSettlement, sequelize, User } from "../../config/db.connection.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";

class GroupDb {
  static createGroup = async(group) => await Group.create(group);

  static addMembers = async(members, transaction) => await GroupMember.bulkCreate(members, {
    "updateOnDuplicate": [ "status", "inviter_id", "role", "deletedAt" ],
    transaction,
    "returning": true
  });

  static getGroupData = async(groupId) => await Group.findByPk(groupId);

  static getGroupMember = async(groupId, userId) => await GroupMember.findOne({
    "where": {
      "group_id": groupId,
      "member_id": userId,
      "status": {
        [ Op.ne ]: "REJECTED" // Exclude members with status 'REJECTED'
      }
    }
  });

  static getUserGroups = async(userId) => {
    const groups = await sequelize.query(
      `select r.group_id, r.group_name, r.group_description, r.image_url, r.creator_id, r.status, r.role, r.has_archived, r.has_blocked, 
      sum(case when gmb.participant1_id = r.group_membership_id	then gmb.balance_amount when gmb.participant2_id = r.group_membership_id then -gmb.balance_amount else 0 end) as balance_amount 
      from 
      (select g.*, gm.group_membership_id, gm.status, gm.role, gm.has_archived, gm.has_blocked, gm."deletedAt"
      from groups g 
      join 
      group_members gm on g.group_id = gm.group_id where gm.member_id = :userId and gm.status!='REJECTED' and g."deletedAt" is null and gm."deletedAt" is null) r 
      left join 
      group_member_balance gmb on gmb.group_id = r.group_id 
      where
      gmb."deletedAt" is null
      group by r.group_id, r.group_name, r.group_description, r.image_url, r.creator_id, r.status, r.role, r.has_archived, r.has_blocked;`, {
        "replacements": { userId },
        "type": QueryTypes.SELECT
      });

    return groups;
  };

  static getGroup = async(groupId, groupMembershipId, isBlocked) => {
    if (!isBlocked) {
      return await sequelize.query(
        `select r.*, u.first_name, u.last_name, u.image_url from (select gm.*, sum(case when gmb.participant1_id = gm.group_membership_id and gmb.participant2_id = :groupMembershipId then gmb.balance_amount when gmb.participant1_id = :groupMembershipId and gmb.participant2_id = gm.group_membership_id then -gmb.balance_amount else 0 end) as balance_with_user, 
        sum(case when gmb.participant1_id = gm.group_membership_id	then gmb.balance_amount when gmb.participant2_id = gm.group_membership_id then -gmb.balance_amount else 0 end) as total_balance 
        from 
        group_members gm 
        left join 
        group_member_balance gmb on gm.group_id = gmb.group_id 
        where 
        gm.group_id = :groupId and gmb."deletedAt" is null
        group by gm.group_membership_id) r 
        join 
        users u on r.member_id = u.user_id;`, {
          "replacements": { groupMembershipId, groupId },
          "type": QueryTypes.SELECT
        }
      );
    }
    return await sequelize.query(
      `select gm.group_membership_id, gm.member_id, u.first_name, u.last_name, u.image_url 
      from 
      group_members gm 
      join 
      users u 
      on 
      gm.member_id = u.user_id 
      where 
      gm.group_id = :groupId`, {
        "replacements": { groupId },
        "type": QueryTypes.SELECT
      }
    );
  };

  static getGroupMembers = async(groupId) => await GroupMember.findAll({
    "where": {
      "group_id": groupId
    }
  });

  static getMembersBlockedGroup = async(groupId, members) => await GroupMember.findAll({
    "where": {
      "group_id": groupId,
      "member_id": {
        [ Op.in ]: members
      },
      "has_blocked": true
    },
    "attributes": [ "member_id" ],
    "paranoid": false
  });

  static countGroupMembers = async(groupId, members = null) => {
    const whereCondition = {
      "group_id": groupId
    };
  
    // Apply the group_membership_id condition only if members is not empty
    if (members && members.length > 0) {
      Object.assign(whereCondition, { "group_membership_id": {
        [ Op.in ]: members
      } });
    }
    
    return await GroupMember.count({
      "where": whereCondition
    });
  };

  static updateGroup = async(groupId, groupData) => await Group.update(groupData, {
    "where": {
      "group_id": groupId
    },
    "returning": true
  });

  static updateGroupMember = async(groupMembershipId, groupMemberData) => {
    const [ rows, [ updatedMember ] ] = await GroupMember.update(groupMemberData, {
      "where": {
        "group_membership_id": groupMembershipId
      },
      "returning": true
    });

    if (rows === 0) {
      return 0;
    }
    return updatedMember;
  };

  static getGroupMembersByIds = async(ids, field, whereCondition = {}) => {
    const members = await GroupMember.findAll({
      "where": {
        [ field ]: {
          [ Op.in ]: ids
        },
        ...whereCondition
      },
      "raw": true
    });

    return members.sort(
      (a, b) => ids.indexOf(a.group_membership_id) - ids.indexOf(b.group_membership_id)
    );
  };

  static saveMessage = async(messageData, groupId, groupMembershipId) => await GroupMessage.create({ ...messageData, "group_id": groupId, "sender_id": groupMembershipId });

  static getMessages = async(groupId, pageSize, timestamp) => {
    return await GroupMessage.findAll({
      "where": {
        "group_id": groupId,
        "createdAt": {
          [ Op.lt ]: timestamp
        }
      },
      "order": [ [ "createdAt", "DESC" ] ],
      "limit": pageSize
    });
  };

  static leaveGroup = async(groupMembershipId) => await GroupMember.destroy({
    "where": {
      "group_membership_id": groupMembershipId
    }
  });

  static addExpense = async(expenseData, transaction) => {
    return await GroupExpense.create(expenseData, { transaction, "raw": true });
  };

  static updateExpense = async(expenseData, transaction) => {
    const [ affectedCount, updatedRows ] = await GroupExpense.update(expenseData, {
      "where": {
        "group_expense_id": expenseData.group_expense_id
      },
      transaction,
      "returning": true
    });
  
    if (affectedCount === 0) {
      throw new ErrorHandler(400, "No records updated. Expense not found.");
    }

    return updatedRows;
  };

  static deleteExpense = async(groupExpenseId, transaction) => await GroupExpense.destroy({
    "where": {
      "group_expense_id": groupExpenseId
    },
    transaction
  });

  static addExpenseParticipants = async(debtors, transaction) => await GroupExpenseParticipant.bulkCreate(debtors, {
    "updateOnDuplicate": [ "debtor_amount", "updatedAt" ],
    "conflictFields": [ "group_expense_id", "debtor_id" ],
    transaction
  });

  static deleteExpenseParticipants = async(groupExpenseId, transaction, participants) => {
    const whereCondition = {
      "group_expense_id": groupExpenseId
    };

    if (participants) {
      const debtorIds = participants.map((participant) => participant.debtor_id);

      Object.assign(whereCondition, { "debtor_id": {
        [ Op.in ]: debtorIds
      } });
    }

    return await GroupExpenseParticipant.destroy({
      "where": whereCondition,
      transaction
    });
  };

  static addSettlement = async(settlementData, transaction) => await GroupSettlement.create(settlementData, { transaction });

  static updateMembersBalance = async(membersBalance, transaction) => {
    return await sequelize.query(`
      INSERT INTO group_member_balance
      VALUES 
        ${membersBalance}
      ON CONFLICT (group_id, LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id))
      DO UPDATE SET balance_amount = group_member_balance.balance_amount + 
        CASE 
            WHEN group_member_balance.participant1_id = EXCLUDED.participant1_id THEN EXCLUDED.balance_amount
            ELSE -EXCLUDED.balance_amount
        END, "updatedAt" = CURRENT_TIMESTAMP
      returning *;`, {
      "type": QueryTypes.INSERT,
      transaction
    });
  };

  static updateMemberBalanceByPk = async(membersBalance, transaction = null) => {
    return await sequelize.query(`
      INSERT INTO group_member_balance (balance_id, group_id, participant1_id, participant2_id, balance_amount, "createdAt", "updatedAt")
      VALUES 
        ${membersBalance}
      ON CONFLICT (balance_id)
      DO UPDATE 
        SET balance_amount = EXCLUDED.balance_amount,
          "updatedAt" = EXCLUDED."updatedAt"
      returning *;
      `, {
      "type": QueryTypes.INSERT,
      transaction
    });
  };

  static getMemberBalance = async(groupId, payerId, debtorId) => await GroupMemberBalance.findOne({
    "where": {
      "group_id": groupId,
      [ Op.or ]: [
        {
          "participant1_id": payerId,
          "participant2_id": debtorId
        },
        {
          "participant1_id": debtorId,
          "participant2_id": payerId
        }
      ]
    }
  });

  static getMembersBalance = async(groupId, members) => {
    const orConditions = [];

    members.forEach((member) => orConditions.push(
      { "participant1_id": member.payer_id, "participant2_id": member.debtor_id },
      { "participant1_id": member.debtor_id, "participant2_id": member.payer_id }
    ));
    

    return GroupMemberBalance.findAll({
      "where": {
        "group_id": groupId,
        [ Op.or ]: orConditions
      },
      "raw": true
    });
  };

  static userBalanceInGroup = async(groupId, groupMembershipId) => {
    return await sequelize.query(
      `select sum(balance_amount) as amount from group_member_balance where 
      group_id = :groupId and (participant1_id = :groupMembershipId or participant2_id = :groupMembershipId) group by group_id;`, {
        "replacements": { groupId, groupMembershipId },
        "type": QueryTypes.SELECT
      }
    );
  };

  static getExpense = async(groupExpenseId) => await GroupExpense.findOne({
    "where": {
      "group_expense_id": groupExpenseId
    },
    "include": [
      {
        "model": GroupExpenseParticipant,
        "required": true
      }
    ]
  });

  static getExpenseParticipants = async(groupExpenseId) => await GroupExpenseParticipant.findAll({
    "where": {
      "group_expense_id": groupExpenseId
    }
  });

  static getExpenses = async(groupId, groupMembershipId, pageSize, timestamp, fetchAll) => {
    return await sequelize.query(`SELECT
      ge.*,
      array_agg(
          jsonb_build_object(
              'debtor_id', ep.debtor_id,
              'debtor_amount', ep.debtor_amount
          )
      ) AS participants,
      SUM(ep.debtor_amount) AS total_debt_amount,
      MAX(CASE WHEN ep.debtor_id = :groupMembershipId THEN ep.debtor_amount ELSE 0 END) AS user_debt
      FROM
        group_expenses ge
      LEFT JOIN
        group_expense_participants ep
        ON ge.group_expense_id = ep.group_expense_id
      WHERE
        ge.group_id = :groupId and ge."deletedAt" is null and ep."deletedAt" is null and ge."createdAt" < :timestamp
      GROUP BY
        ge.group_expense_id
      ORDER BY
        ge."createdAt" DESC
      ${fetchAll ? "" : "LIMIT :pageSize"};`, {
      "replacements": { groupMembershipId, groupId, pageSize, timestamp, fetchAll },
      "type": QueryTypes.SELECT
    });
  };

  static getSettlements = async(groupId, pageSize, timestamp, fetchAll) => {
    const options = {
      "where": {
        "group_id": groupId,
        "createdAt": {
          [ Op.lt ]: timestamp
        }
      },
      "order": [ [ "createdAt", "DESC" ] ]
    };

    if (!fetchAll) {
      options.limit = pageSize;
    }

    return await GroupSettlement.findAll(options);
  };

  static getSettlement = async(groupSettlementId) => await GroupSettlement.findByPk(groupSettlementId);

  static getExpenseParticipantsDetails = async(debtors) => {
    const debtorDetails = await GroupMember.findAll({
      "where": {
        "group_membership_id": {
          [ Op.in ]: debtors
        }
      },
      "include": [
        {
          "model": User,
          "required": true
        }
      ]
    });

    return debtorDetails;
  };
}

export default GroupDb;
