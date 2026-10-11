import {
  joinRoomRequestSchema,
  type JoinRoomRequest,
  type JoinRoomResponse,
  type RoomSnapshot,
} from '@fibopoker/shared';
import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CreateRoom } from '../domain/create-room.js';
import { GetRoomSnapshot } from '../domain/get-room-snapshot.js';
import { JoinRoom } from '../domain/join-room.js';
import { bearerToken } from './bearer-token.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly createRoom: CreateRoom,
    private readonly joinRoom: JoinRoom,
    private readonly getRoomSnapshot: GetRoomSnapshot,
  ) {}

  @Post()
  create(): Promise<RoomSnapshot> {
    return this.createRoom.execute();
  }

  @Post(':roomId/participants')
  join(
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(joinRoomRequestSchema)) { nickname }: JoinRoomRequest,
  ): Promise<JoinRoomResponse> {
    return this.joinRoom.execute({ roomId, nickname });
  }

  @Get(':roomId')
  snapshot(
    @Param('roomId') roomId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<RoomSnapshot> {
    return this.getRoomSnapshot.execute({ roomId, token: bearerToken(authorization) });
  }
}
