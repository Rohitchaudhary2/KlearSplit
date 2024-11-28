class GroupUtils {
  static assignRoles(members, admins, coadmins, inviterId, groupId) {
    if (!(admins || coadmins)) {
      return members.map((userId) => ({ "inviter_id": inviterId, "group_id": groupId, "member_id": userId }));
    }
    
    return members.map((userId) => {
      const member = { "inviter_id": inviterId, "group_id": groupId, "member_id": userId };

      if (admins.includes(userId)) {
        member.role = "Admin";
      } else if (coadmins.includes(userId)) {
        member.role = "Co-Admin";
      }
      
      return member;
    });
  }
}

export default GroupUtils;
