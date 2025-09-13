import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ChatGateway],
  exports: [ChatGateway, PrismaModule], // Export the module instead of service
})
export class ChatModule {}
