class GroupUtils {
  static assignRoles(members, admins, coadmins, inviterId, groupId) {
    // if (!(admins || coadmins)) {
    //   return members.map((userId) => ({ "inviter_id": inviterId, "group_id": groupId, "member_id": userId }));
    // }
    
    return members.map((userId) => {
      const member = { "inviter_id": inviterId, "group_id": groupId, "member_id": userId };

      if (admins && admins.includes(userId)) {
        member.role = "ADMIN";
      } else if (coadmins && coadmins.includes(userId)) {
        member.role = "COADMIN";
      }
      
      return member;
    });
  }
}

export default GroupUtils;
