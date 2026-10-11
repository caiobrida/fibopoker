import { Module } from '@nestjs/common';
import { CLOCK, type Clock } from './domain/clock.js';
import { CreateRoom } from './domain/create-room.js';
import { GetRoomSnapshot } from './domain/get-room-snapshot.js';
import { JoinRoom } from './domain/join-room.js';
import { ROOM_REPOSITORY, type RoomRepository } from './domain/room-repository.js';
import { RoomsController } from './http/rooms.controller.js';
import { PrismaRoomRepository } from './infra/prisma-room-repository.js';
import { prisma } from './infra/prisma.js';
import { SystemClock } from './infra/system-clock.js';

@Module({
  controllers: [RoomsController],
  providers: [
    {
      provide: ROOM_REPOSITORY,
      useFactory: () => new PrismaRoomRepository(prisma),
    },
    {
      provide: CLOCK,
      useFactory: () => new SystemClock(),
    },
    {
      provide: CreateRoom,
      useFactory: (rooms: RoomRepository) => new CreateRoom(rooms),
      inject: [ROOM_REPOSITORY],
    },
    {
      provide: JoinRoom,
      useFactory: (rooms: RoomRepository, clock: Clock) => new JoinRoom(rooms, clock),
      inject: [ROOM_REPOSITORY, CLOCK],
    },
    {
      provide: GetRoomSnapshot,
      useFactory: (rooms: RoomRepository, clock: Clock) => new GetRoomSnapshot(rooms, clock),
      inject: [ROOM_REPOSITORY, CLOCK],
    },
  ],
})
export class AppModule {}
