import { QueryTypes } from "sequelize";
import { Group, GroupMember, sequelize } from "../../config/db.connection.js";

class GroupDb {
  static createGroup = async(group) => await Group.create(group);

  static addMembers = async(members) => await GroupMember.bulkCreate(members, { "returning": true });

  static getGroupData = async(groupId) => await Group.findByPk(groupId);

  static getGroupMember = async(groupId, userId) => await GroupMember.findOne({
    "where": {
      "group_id": groupId,
      "member_id": userId
    }
  });

  static getUserGroups = async(userId) => {
    const groups = await sequelize.query(
      `select r.group_id, r.group_name, r.group_description, r.image_url, r.creator_id, 
      sum(case when gmb.participant1_id = r.group_membership_id	then gmb.balance_amount when gmb.participant2_id = r.group_membership_id then -gmb.balance_amount else 0 end) as balance_amount 
      from 
      (select g.*, gm.group_membership_id 
      from groups g 
      join 
      group_members gm on g.group_id = gm.group_id where gm.member_id = '${userId}') r 
      left join 
      group_member_balance gmb on gmb.group_id = r.group_id 
      group by r.group_id, r.group_name, r.group_description, r.image_url, r.creator_id;`, {
        "type": QueryTypes.SELECT
      });

    return groups;
  };

  static getGroup = async(groupId, groupMembershipId) => {
    const group = await sequelize.query(
      `select gm.*, sum(case when gmb.participant1_id = gm.group_membership_id and gmb.participant2_id = '${groupMembershipId}' then gmb.balance_amount when gmb.participant1_id = '${groupMembershipId}' and gmb.participant2_id = gm.group_membership_id then -gmb.balance_amount else 0 end) as balance_with_user, 
      sum(case when gmb.participant1_id = gm.group_membership_id	then gmb.balance_amount when gmb.participant2_id = gm.group_membership_id then -gmb.balance_amount else 0 end) as total_balance 
      from 
      group_members gm 
      left join 
      group_member_balance gmb on gm.group_id = gmb.group_id 
      where 
      gm.group_id = '${groupId}' and gm.group_membership_id != '${groupMembershipId}' 
      group by gm.group_membership_id;`, {
        "type": QueryTypes.SELECT
      }
    );

    return group;
  };
}

export default GroupDb;
