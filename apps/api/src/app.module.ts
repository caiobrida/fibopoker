import { Module } from '@nestjs/common';
import { CreateRoom } from './domain/create-room.js';
import { GetRoomSnapshot } from './domain/get-room-snapshot.js';
import { ROOM_REPOSITORY, type RoomRepository } from './domain/room-repository.js';
import { RoomsController } from './http/rooms.controller.js';
import { PrismaRoomRepository } from './infra/prisma-room-repository.js';
import { prisma } from './infra/prisma.js';

@Module({
  controllers: [RoomsController],
  providers: [
    {
      provide: ROOM_REPOSITORY,
      useFactory: () => new PrismaRoomRepository(prisma),
    },
    {
      provide: CreateRoom,
      useFactory: (rooms: RoomRepository) => new CreateRoom(rooms),
      inject: [ROOM_REPOSITORY],
    },
    {
      provide: GetRoomSnapshot,
      useFactory: (rooms: RoomRepository) => new GetRoomSnapshot(rooms),
      inject: [ROOM_REPOSITORY],
    },
  ],
})
export class AppModule {}
