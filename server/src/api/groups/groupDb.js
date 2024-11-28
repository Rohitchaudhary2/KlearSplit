import { QueryTypes } from "sequelize";
import { Group, GroupMember, sequelize } from "../../config/db.connection.js";

class GroupDb {
  static createGroup = async(group) => await Group.create(group);

  static addMembers = async(members) => await GroupMember.bulkCreate(members);

  static getGroupData = async(groupId) => await Group.findByPk(groupId);

  static getGroupMember = async(groupId, inviterId) => await GroupMember.findOne({
    "where": {
      "group_id": groupId,
      "member_id": inviterId
    }
  });

  static getUserGroups = async(userId) => {
    const groups = await sequelize.query(
      `select r.group_id, r.group_name, r.group_description, r.image_url, r.creator_id, 
      sum(case when gmb.participant1_id = r.group_membership_id	then gmb.balance_amount when gmb.participant2_id = r.group_membership_id then -gmb.balance_amount else 0 end) as balance_amount 
      from 
      (select g.group_id, g.group_name, g.group_description, g.image_url, g.creator_id, gm.group_membership_id 
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
}

export default GroupDb;
