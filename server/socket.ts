import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db, calculateDistanceKm, estimateEtaMinutes } from './db';
import { LiveLocation, PickupTrackingStatus, PickupSession } from './types';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // Join room for active food request pickup tracking
    socket.on('join_pickup_room', (data: { requestId: string; userId?: string }) => {
      const { requestId } = data;
      if (!requestId) return;

      const roomName = `pickup:${requestId}`;
      socket.join(roomName);

      // Send initial tracking session state to connecting client
      const session = db.getOrCreatePickupSession(requestId);
      if (session) {
        socket.emit('pickup_session_state', session);
      }
    });

    socket.on('leave_pickup_room', (data: { requestId: string }) => {
      const { requestId } = data;
      if (!requestId) return;
      socket.leave(`pickup:${requestId}`);
    });

    // Real-time receiver location update (from browser Geolocation API)
    socket.on('receiver_location_update', (data: { requestId: string; location: LiveLocation }) => {
      const { requestId, location } = data;
      if (!requestId || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return;
      }

      // Update minimal ephemeral session state
      const updatedSession = db.updatePickupLocation(requestId, location);
      if (updatedSession) {
        // Broadcast to all clients in the room (both receiver and donor)
        io.to(`pickup:${requestId}`).emit('pickup_location_changed', {
          requestId,
          receiverLocation: updatedSession.receiverLocation,
          distanceKm: updatedSession.distanceKm,
          etaMinutes: updatedSession.etaMinutes,
          trackingStatus: updatedSession.trackingStatus,
          lastUpdated: updatedSession.lastUpdated,
        });
      }
    });

    // Tracking status transition (accepted -> on_the_way -> arrived -> collected)
    socket.on('tracking_status_update', (data: { requestId: string; status: PickupTrackingStatus }) => {
      const { requestId, status } = data;
      if (!requestId || !status) return;

      const updatedSession = db.updatePickupTrackingStatus(requestId, status);
      if (updatedSession) {
        io.to(`pickup:${requestId}`).emit('pickup_status_changed', {
          requestId,
          status,
          session: updatedSession,
        });

        if (status === 'collected') {
          io.to(`pickup:${requestId}`).emit('pickup_completed', { requestId });
        }
      }
    });

    // Stop live tracking / remove coordinates
    socket.on('stop_tracking', (data: { requestId: string }) => {
      const { requestId } = data;
      if (!requestId) return;

      const session = db.stopPickupTracking(requestId);
      io.to(`pickup:${requestId}`).emit('pickup_tracking_stopped', {
        requestId,
        session,
      });
    });

    socket.on('disconnect', () => {
      // Room cleanup is handled automatically by Socket.io
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastPickupStatus(requestId: string, status: PickupTrackingStatus, session?: PickupSession) {
  if (ioInstance) {
    ioInstance.to(`pickup:${requestId}`).emit('pickup_status_changed', {
      requestId,
      status,
      session,
    });
  }
}
