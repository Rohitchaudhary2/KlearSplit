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
      "role": "CREATOR",
      "status": "ACCEPTED"
    } ];

    const groupCreator = await GroupDb.addMembers(groupCreatorData);
    
    await this.assignRolesAndAddMembers(groupData.membersData, groupCreator[ 0 ].dataValues.group_membership_id, group.group_id);
    return group;
  };

  static addMembers = async(membersData, userId, groupId) => {
    const isGroupExists = await GroupDb.getGroupData(groupId);

    if (!isGroupExists) {
      throw new ErrorHandler(404, "Group does not Exist");
    }

    const inviter = await GroupDb.getGroupMember(groupId, userId);

    if (!inviter || inviter.role === "USER") {
      throw new ErrorHandler(403, "You are not allowed to invite members to this group");
    }

    const addedMembers = await this.assignRolesAndAddMembers(membersData, inviter.group_membership_id, groupId);

    return addedMembers;
  };

  static getUserGroups = async(userId) => {
    const groups = await GroupDb.getUserGroups(userId);

    const { acceptedGroups, invitedGroups } = groups.reduce((acc, val) => {
      switch (val.status) {
        case "ACCEPTED":
          acc.acceptedGroups.push(val);
          break;
        case "PENDING":
          acc.invitedGroups.push(val);
          break;
        default:
          throw new ErrorHandler(500, "User specific groups have wrong status");
      }
      return acc;
    }, { "acceptedGroups": [], "invitedGroups": [] });

    return { acceptedGroups, invitedGroups };
  };

  static isUserMemberOfGroup = async(groupId, userId) => {
    const userMembershipInfo = await GroupDb.getGroupMember(groupId, userId);

    if (!userMembershipInfo) {
      throw new ErrorHandler(403, "You are not Part of this group");
    }
    return userMembershipInfo.dataValues;
  };

  static getGroup = async(groupId, userId) => {
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    const group = await GroupDb.getGroup(groupId, userMembershipInfo.group_membership_id);

    group.push({ ...userMembershipInfo, "balance_with_user": 0, "total_balance": 0 });

    return group;
  };

  static updateGroup = async(groupId, groupData, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    await this.isUserMemberOfGroup(groupId, userId);

    const updatedGroup = await GroupDb.updateGroup(groupId, groupData);

    return updatedGroup;
  };

  static updateGroupMember = async(groupId, groupMemberData, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    if (groupMemberData.status && userMembershipInfo.status !== "PENDING") {
      throw new ErrorHandler(400, "Status can't be changed once accepted or rejected the group invitation.");
    }

    const updatedMember = GroupDb.updateGroupMember(userMembershipInfo.group_membership_id, groupMemberData);

    return updatedMember;
  };
}

export default GroupService;
