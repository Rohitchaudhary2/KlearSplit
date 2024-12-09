import FriendService from "../friends/friendService.js";
import logger from "../utils/logger.js";

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    // Listen for joining a conversation room
    socket.on("joinRoom", (conversationId) => {
      socket.join(conversationId);
    });

    // Listen for leaving a conversation room
    socket.on("leaveRoom", (conversationId) => {
      socket.leave(conversationId);
    });

    // Listen for new chat message
    socket.on("sendConversationMessage", async(messageData) => {
      try {
        const { "conversation_id": conversationId, "sender_id": senderId, message } = messageData;
        // Save message to DB using FriendService
        const savedMessage = await FriendService.saveMessage({
          "conversation_id": conversationId,
          "sender_id": senderId,
          message
        });

        // Emit the message to the users in the room
        io.to(conversationId).emit("newMessage", savedMessage);
      } catch (error) {
        logger.log({
          "level": "error",
          "message": JSON.stringify({ "statusCode": 500, "message": error.message })
        });

        // Notify the client about the error while sending the message
        socket.emit("messageError", {
          "message": "Failed to send the message. Please try again."
        });
      }
    });
    
    // Listen for new group chat message
    socket.on("sendGroupMessage", async(messageData) => {
      try {
        // Emit the message to the users in the room
        io.to(messageData.group_id).emit("newMessage", messageData);
      } catch (error) {
        logger.log({
          "level": "error",
          "message": JSON.stringify({ "statusCode": 500, "message": error.message })
        });

        // Notify the client about the error while sending the message
        socket.emit("messageError", {
          "message": "Failed to send the message. Please try again."
        });
      }
    });

    // Disconnect event
    socket.on("disconnect", () => {});
  });
};

export default socketHandler;
