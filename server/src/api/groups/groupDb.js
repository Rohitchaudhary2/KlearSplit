import { Group, GroupMember } from "../../config/db.connection.js";

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
}

export default GroupDb;
