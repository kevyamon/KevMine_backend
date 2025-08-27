import { Server } from 'socket.io';

const userSocketMap = new Map();
const adminSocketMap = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Get the user ID from the handshake auth
    const { userId, isAdmin } = socket.handshake.auth;

    if (userId) {
      if (isAdmin) {
        adminSocketMap.set(userId, socket.id);
        console.log(`Admin ${userId} connected`);
        // Notify all admins about the new admin connection
        io.to(Array.from(adminSocketMap.values())).emit('admin_connected', { userId });
      } else {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} connected`);
        io.emit('onlineUsers', Array.from(userSocketMap.keys()));
      }
    }

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      let disconnectedUserId;
      // Check if it's a regular user
      userSocketMap.forEach((value, key) => {
        if (value === socket.id) {
          disconnectedUserId = key;
          userSocketMap.delete(key);
        }
      });

      // Check if it's an admin
      if (!disconnectedUserId) {
        adminSocketMap.forEach((value, key) => {
          if (value === socket.id) {
            disconnectedUserId = key;
            adminSocketMap.delete(key);
            // Notify all admins about the admin disconnection
            io.to(Array.from(adminSocketMap.values())).emit('admin_disconnected', { userId: disconnectedUserId });
          }
        });
      }

      if (disconnectedUserId) {
        io.emit('onlineUsers', Array.from(userSocketMap.keys()));
      }
    });

    // Handle real-time events from clients (e.g., admin dashboard)
    socket.on('request_user_status', async (userId) => {
        // You would typically fetch the user status from the database here
        // and emit it back to the admin who requested it.
        // For now, we'll just log it.
        console.log(`Admin requested status for user: ${userId}`);
    });
  });

  io.getSocketIdByUserId = (userId) => {
    return userSocketMap.get(userId);
  };
  
  io.getAdminSockets = () => {
      return Array.from(adminSocketMap.values());
  };
};

export default socketHandler;