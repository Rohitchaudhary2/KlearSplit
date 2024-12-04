import { Op, QueryTypes } from "sequelize";
import { Group, GroupExpense, GroupExpenseParticipant, GroupMember, GroupMessage, GroupSettlement, sequelize } from "../../config/db.connection.js";

class GroupDb {
  static createGroup = async(group) => await Group.create(group);

  static addMembers = async(members, transaction) => await GroupMember.bulkCreate(members, {
    "updateOnDuplicate": [ "status", "inviter_id", "role" ],
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
      `select r.group_id, r.group_name, r.group_description, r.image_url, r.creator_id, r.status, r.role, r.has_archived, 
      sum(case when gmb.participant1_id = r.group_membership_id	then gmb.balance_amount when gmb.participant2_id = r.group_membership_id then -gmb.balance_amount else 0 end) as balance_amount 
      from 
      (select g.*, gm.group_membership_id, gm.status, gm.role, gm.has_archived
      from groups g 
      join 
      group_members gm on g.group_id = gm.group_id where gm.member_id = :userId and gm.status!='REJECTED') r 
      left join 
      group_member_balance gmb on gmb.group_id = r.group_id 
      group by r.group_id, r.group_name, r.group_description, r.image_url, r.creator_id, r.status, r.role, r.has_archived;`, {
        "replacements": { userId },
        "type": QueryTypes.SELECT
      });

    return groups;
  };

  static getGroup = async(groupId, groupMembershipId) => {
    const group = await sequelize.query(
      `select r.*, u.first_name, u.last_name, u.image_url from (select gm.*, sum(case when gmb.participant1_id = gm.group_membership_id and gmb.participant2_id = :groupMembershipId then gmb.balance_amount when gmb.participant1_id = :groupMembershipId and gmb.participant2_id = gm.group_membership_id then -gmb.balance_amount else 0 end) as balance_with_user, 
      sum(case when gmb.participant1_id = gm.group_membership_id	then gmb.balance_amount when gmb.participant2_id = gm.group_membership_id then -gmb.balance_amount else 0 end) as total_balance 
      from 
      group_members gm 
      left join 
      group_member_balance gmb on gm.group_id = gmb.group_id 
      where 
      gm.group_id = :groupId and gm.group_membership_id != :groupMembershipId 
      group by gm.group_membership_id) r 
      join 
      users u on r.member_id = u.user_id;`, {
        "replacements": { groupMembershipId, groupId },
        "type": QueryTypes.SELECT
      }
    );

    return group;
  };

  static getGroupMembers = async(groupId) => await GroupMember.findAll({
    "where": {
      "group_id": groupId
    }
  });

  static countGroupMembers = async(groupId, members) => await GroupMember.count({
    "where": {
      "group_id": groupId,
      "group_membership_id": {
        [ Op.in ]: members
      }
    }
  });

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

  static saveMessage = async(messageData, groupId, groupMembershipId) => await GroupMessage.create({ ...messageData, "group_id": groupId, "sender_id": groupMembershipId });

  static getMessages = async(groupId, page = 1, pageSize = 10) => {
    const offset = (page - 1) * pageSize;

    return await GroupMessage.findAll({
      "where": {
        "group_id": groupId
      },
      "order": [ [ "createdAt", "DESC" ] ],
      "limit": pageSize,
      offset
    });
  };

  static leaveGroup = async(groupMembershipId) => await GroupMember.destroy({
    "where": {
      "group_membership_id": groupMembershipId
    }
  });

  static addExpense = async(expenseData, transaction) => await GroupExpense.create(expenseData, { transaction });

  static addExpenseParticipants = async(debtors, transaction) => await GroupExpenseParticipant.bulkCreate(debtors, { transaction });

  static addSettlement = async(settlementData, transaction) => await GroupSettlement.create(settlementData, { transaction });

  static updateMembersBalance = async(membersBalance, transaction) => {
    await sequelize.query(`
      INSERT INTO group_member_balance (group_id, participant1_id, participant2_id, balance_amount)
      VALUES 
        ${membersBalance}
      ON CONFLICT (group_id, LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id))
      DO UPDATE SET balance_amount = group_member_balance.balance_amount + 
        CASE 
            WHEN group_member_balance.participant1_id = EXCLUDED.participant1_id THEN EXCLUDED.balance_amount
            ELSE -EXCLUDED.balance_amount
        END;`, {
      "type": QueryTypes.INSERT,
      transaction
    });
  };

  static getExpenses = async(groupId, page = 1, pageSize = 20) => {
    const offset = (page - 1) * pageSize;

    return await GroupExpense.findAll({
      "where": {
        "group_id": groupId
      },
      "order": [ [ "createdAt", "DESC" ] ],
      "limit": pageSize,
      offset
    });
  };

  static getSettlements = async(groupId, page = 1, pageSize = 20) => {
    const offset = (page - 1) * pageSize;

    return await GroupSettlement.findAll({
      "where": {
        "group_id": groupId
      },
      "order": [ [ "createdAt", "DESC" ] ],
      "limit": pageSize,
      offset
    });
  };
}

export default GroupDb;
