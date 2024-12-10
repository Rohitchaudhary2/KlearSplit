import { environment } from "../../environments/environment";

export const API_URLS = {
  login: `${environment.apiBaseUrl}/auth/login`,
  logout: `${environment.apiBaseUrl}/auth/logout`,
  verify: `${environment.apiBaseUrl}/users/verify`,
  register: `${environment.apiBaseUrl}/users/register`,
  googleAuth: `${environment.apiBaseUrl}/auth/google`,
  verifyForgotPassword: `${environment.apiBaseUrl}/users/verifyforgotpassword`,
  forgotPassword: `${environment.apiBaseUrl}/users/forgotpassword`,
  restoreAccountVerify: `${environment.apiBaseUrl}/users/verifyrestore`,
  restoreAccount: `${environment.apiBaseUrl}/users/restore`,
  fetchUser: `${environment.apiBaseUrl}/users/user`,
  getUsers: `${environment.apiBaseUrl}/users/getUsers`,
  addFriend: `${environment.apiBaseUrl}/friends/addfriend`,
  getFriends: `${environment.apiBaseUrl}/friends/getallfriends`,
  acceptRejectRequest: `${environment.apiBaseUrl}/friends/acceptrejectfriend`,
  withdrawRequest: `${environment.apiBaseUrl}/friends/withdrawfriendrequest`,
  archiveBlockRequest: `${environment.apiBaseUrl}/friends/archiveblockfriend`,
  getMessages: `${environment.apiBaseUrl}/friends/getmessages`,
  addExpense: `${environment.apiBaseUrl}/friends/addexpense`,
  getExpenses: `${environment.apiBaseUrl}/friends/getexpenses`,
  deleteExpense: `${environment.apiBaseUrl}/friends/deleteexpense`,
  getCombined: `${environment.apiBaseUrl}/friends/getboth`,
  refreshAccessToken: `${environment.apiBaseUrl}/auth/refreshtoken`,
  getAllExpensesData: `${environment.apiBaseUrl}/dashboard/getallexpensesdata`,
  updateExpense: `${environment.apiBaseUrl}/friends/updateexpense`,
  createGroup: `${environment.apiBaseUrl}/groups/create`,
  getGroups: `${environment.apiBaseUrl}/groups/usergroups`,
  updateGroupMember: `${environment.apiBaseUrl}/groups/updatemember`,
  getGroup: `${environment.apiBaseUrl}/groups`,
  saveGroupMessages: `${environment.apiBaseUrl}/groups/savemessage`,
  getGroupMessages: `${environment.apiBaseUrl}/groups/getmessages`,
  addGroupMembers: `${environment.apiBaseUrl}/groups/addmembers`,
  leaveGroup: `${environment.apiBaseUrl}/groups/leavegroup`,
  addGroupExpense: `${environment.apiBaseUrl}/groups/addexpense`,
};
