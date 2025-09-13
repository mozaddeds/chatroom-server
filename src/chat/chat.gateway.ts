// src/chat/chat.gateway.ts
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, string>(); // socketId -> userId

  constructor(private prisma: PrismaService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Extract user ID from handshake query (set by frontend during connection)
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      this.onlineUsers.set(client.id, userId);
      
      // Update user online status in database
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() }
      });
      
      // Notify all clients about online users
      this.server.emit('online-users', await this.getOnlineUsers());
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.onlineUsers.get(client.id);
    
    if (userId) {
      this.onlineUsers.delete(client.id);
      
      // Update user offline status in database
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() }
      });
      
      // Notify all clients about online users
      this.server.emit('online-users', await this.getOnlineUsers());
    }
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send-message')
  async handleNewMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      message: string; 
      receiverId?: string; 
      groupId?: string;
    },
  ) {
    try {
      const userId = this.onlineUsers.get(client.id);
      
      if (!userId) {
        return { status: 'error', message: 'User not authenticated' };
      }

      // Save message to database
      const newMessage = await this.prisma.message.create({
        data: {
          content: data.message,
          senderId: userId,
          receiverId: data.receiverId,
          groupId: data.groupId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            }
          }
        }
      });

      // Emit message to recipient(s)
      if (data.receiverId) {
        // Direct message
        client.to(data.receiverId).emit('new-message', newMessage);
      } else if (data.groupId) {
        // Group message
        this.server.to(data.groupId).emit('new-message', newMessage);
      }

      return { status: 'success', message: 'Message sent' };
    } catch (error) {
      this.logger.error('Failed to send message', error);
      return { status: 'error', message: 'Failed to send message' };
    }
  }

  @SubscribeMessage('join-group')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(data.groupId);
    return { status: 'success', message: 'Joined group' };
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId?: string; groupId?: string },
  ) {
    const userId = this.onlineUsers.get(client.id);
    
    if (data.receiverId) {
      client.to(data.receiverId).emit('user-typing', {
        userId,
        isTyping: true,
      });
    } else if (data.groupId) {
      client.to(data.groupId).emit('user-typing', {
        userId,
        isTyping: true,
      });
    }
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId?: string; groupId?: string },
  ) {
    const userId = this.onlineUsers.get(client.id);
    
    if (data.receiverId) {
      client.to(data.receiverId).emit('user-typing', {
        userId,
        isTyping: false,
      });
    } else if (data.groupId) {
      client.to(data.groupId).emit('user-typing', {
        userId,
        isTyping: false,
      });
    }
  }

  private async getOnlineUsers(): Promise<string[]> {
    const onlineUsers = await this.prisma.user.findMany({
      where: { isOnline: true },
      select: { id: true }
    });
    
    return onlineUsers.map(user => user.id);
  }
}