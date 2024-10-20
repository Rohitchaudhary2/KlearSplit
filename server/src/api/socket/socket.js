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
    socket.on("sendMessage", async (messageData) => {
      try {
        const { conversation_id, sender_id, message } = messageData;
        // Save message to DB using FriendService
        const savedMessage = await FriendService.saveMessage({
          conversation_id,
          sender_id,
          message,
        });

        // Emit the message to the users in the room
        io.to(conversation_id).emit("newMessage", savedMessage);
      } catch (error) {
        logger.log({
          level: "error",
          statusCode: 500,
          message: error.message,
        });

        socket.emit("messageError", {
          message: "Failed to send the message. Please try again.",
        });
      }
    });

    // Disconnect event
    socket.on("disconnect", () => {});
  });
};

export default socketHandler;
