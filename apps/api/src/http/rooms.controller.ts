import type { RoomSnapshot } from '@fibopoker/shared';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRoom } from '../domain/create-room.js';
import { GetRoomSnapshot } from '../domain/get-room-snapshot.js';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly createRoom: CreateRoom,
    private readonly getRoomSnapshot: GetRoomSnapshot,
  ) {}

  @Post()
  create(): Promise<RoomSnapshot> {
    return this.createRoom.execute();
  }

  @Get(':roomId')
  snapshot(@Param('roomId') roomId: string): Promise<RoomSnapshot> {
    return this.getRoomSnapshot.execute(roomId);
  }
}
