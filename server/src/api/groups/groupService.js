import { ErrorHandler } from "../middlewares/errorHandler.js";
import GroupDb from "./groupDb.js";
import GroupUtils from "./groupUtils.js";

class GroupService {
  static assignRolesAndAddMembers = async(membersData, inviterId, groupId) => {
    const members = GroupUtils.assignRoles(membersData.members, membersData.admins, membersData.coadmins, inviterId, groupId);

    return await GroupDb.addMembers(members);
  };

  static createGroup = async(groupData, userId) => {
    Object.assign(groupData.group, { "creator_id": userId });
    
    const group = await GroupDb.createGroup(groupData.group);

    if (!group) {
      throw new ErrorHandler(400, "Error while creating group");
    }

    const groupCreatorData = [ {
      "group_id": group.group_id,
      "member_id": group.creator_id,
      "role": "CREATOR"
    } ];

    const groupCreator = await GroupDb.addMembers(groupCreatorData);
    
    await this.assignRolesAndAddMembers(groupData.membersData, groupCreator.group_membership_id, group.group_id);
    return group;
  };

  static addMembers = async(membersData, inviterId, groupId) => {
    const isGroupExists = await GroupDb.getGroupData(groupId);

    if (!isGroupExists) {
      throw new ErrorHandler(400, "Group does not Exist");
    }

    const inviter = await GroupDb.getGroupMember(groupId, inviterId);

    if (!inviter || inviter.role === "USER") {
      throw new ErrorHandler(400, "You are not allowed to invite members to this group");
    }

    const addedMembers = await this.assignRolesAndAddMembers(membersData, inviterId, groupId);

    return addedMembers;
  };

  static getUserGroups = async(userId) => {
    const groups = await GroupDb.getUserGroups(userId);

    return groups;
  };

  static getGroup = async(groupId) => {
    const group = await GroupDb.getGroup(groupId);

    return group;
  };
}

export default GroupService;
