import { Module } from '@nestjs/common';
import { CastEstimate } from './domain/cast-estimate.js';
import { CLOCK, type Clock } from './domain/clock.js';
import { CreateRoom } from './domain/create-room.js';
import { GetRoomSnapshot } from './domain/get-room-snapshot.js';
import { JoinRoom } from './domain/join-room.js';
import { OpenRound } from './domain/open-round.js';
import { RevealRound } from './domain/reveal-round.js';
import { ROOM_REPOSITORY, type RoomRepository } from './domain/room-repository.js';
import { SetFinalEstimate } from './domain/set-final-estimate.js';
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
    {
      provide: OpenRound,
      useFactory: (rooms: RoomRepository, clock: Clock) => new OpenRound(rooms, clock),
      inject: [ROOM_REPOSITORY, CLOCK],
    },
    {
      provide: CastEstimate,
      useFactory: (rooms: RoomRepository, clock: Clock) => new CastEstimate(rooms, clock),
      inject: [ROOM_REPOSITORY, CLOCK],
    },
    {
      provide: RevealRound,
      useFactory: (rooms: RoomRepository, clock: Clock) => new RevealRound(rooms, clock),
      inject: [ROOM_REPOSITORY, CLOCK],
    },
    {
      provide: SetFinalEstimate,
      useFactory: (rooms: RoomRepository) => new SetFinalEstimate(rooms),
      inject: [ROOM_REPOSITORY],
    },
  ],
})
export class AppModule {}
