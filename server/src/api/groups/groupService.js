import { ErrorHandler } from "../middlewares/errorHandler.js";
import GroupDb from "./groupDb.js";
import GroupUtils from "./groupUtils.js";

class GroupService {
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

    await GroupDb.addMembers(groupCreatorData);
    
    await this.addMembers(groupData.membersData, userId, group.group_id);
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

    const members = GroupUtils.assignRoles(membersData.members, membersData.admins, membersData.coadmins, groupId, inviter.group_membership_id);

    const addedMembers = await GroupDb.addMembers(members);

    return addedMembers;
  };
}

export default GroupService;
