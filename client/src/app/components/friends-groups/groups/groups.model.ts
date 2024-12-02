export interface CreateGroupData {
    group: {
        group_name: string;
        group_description: string;
        image_url: string;
    };
    memberData: {
        members: [];
        admins: [];
        coadmins: [];
    }
}

export interface CreateGroupResponse {
    success: string;
    message: string;
    data: {
        group_id: string;
        group_name: string;
        group_description: string;
        image_url: string;
        creator_id: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    }
}

export interface SearchedUser {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface SearchedUserResponse {
    success: string;
    message: string;
    data: SearchedUser[];
}

export interface MemberData {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    image_url: string;
}

export interface GroupData {
    group_id: string;
    group_name: string;
    group_description: string;
    image_url: string;
    creator_id: string;
    balance_amount: string;
    status: string;
}

export interface Groups {
    success: string;
    message: string;
    data: {
        invitedGroups: GroupData[];
        acceptedGroups: GroupData[];
    };
}

export interface GroupMemberData {
    group_membership_id: string;
    group_id: string;
    inviter_id: string;
    member_id: string;
    status: string;
    role: string;
    has_archived: boolean;
    balance_with_user: string;
    total_balance: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface GroupResponse {
    success: string;
    message: string;
    data: GroupMemberData[];
}

export interface GroupMessageData {
    group_message_id: string;
    group_id: string;
    sender_id: string;
    message: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface GroupExpenseData {
    group_expense_id: string;
    group_id: string;
    expense_name: string;
    payer_id: string;
    total_amount: string;
    description: string;
    receipt_url: string | null;
    split_type: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    payer: string;
}

export interface CombinedGroupMessage extends GroupMessageData {
    type: string;
}

export interface CombinedGroupExpense extends GroupExpenseData {
    type: string;
}

export interface CombinedView {
    success: string;
    message: string;
    data: (CombinedGroupExpense | CombinedGroupMessage)[];
}