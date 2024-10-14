export interface Message {
  message_id: string;
  sender_id: string;
  sender: string;
  conversation_id: string;
  message: string;
  is_read: boolean;
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data: Message[] | [];
}
