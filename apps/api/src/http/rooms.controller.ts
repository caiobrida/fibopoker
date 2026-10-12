import {
  castEstimateRequestSchema,
  joinRoomRequestSchema,
  openRoundRequestSchema,
  setFinalEstimateRequestSchema,
  type CastEstimateRequest,
  type JoinRoomRequest,
  type JoinRoomResponse,
  type OpenRoundRequest,
  type OpenRoundResponse,
  type RoomSnapshot,
  type SetFinalEstimateRequest,
} from '@fibopoker/shared';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CastEstimate } from '../domain/cast-estimate.js';
import { CreateRoom } from '../domain/create-room.js';
import { GetRoomSnapshot } from '../domain/get-room-snapshot.js';
import { JoinRoom } from '../domain/join-room.js';
import { OpenRound } from '../domain/open-round.js';
import { ReVote } from '../domain/re-vote.js';
import { RevealRound } from '../domain/reveal-round.js';
import { SetFinalEstimate } from '../domain/set-final-estimate.js';
import { bearerToken } from './bearer-token.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly createRoom: CreateRoom,
    private readonly joinRoom: JoinRoom,
    private readonly getRoomSnapshot: GetRoomSnapshot,
    private readonly openRound: OpenRound,
    private readonly castEstimate: CastEstimate,
    private readonly revealRound: RevealRound,
    private readonly reVote: ReVote,
    private readonly setFinalEstimate: SetFinalEstimate,
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

  @Post(':roomId/rounds')
  open(
    @Param('roomId') roomId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body(new ZodValidationPipe(openRoundRequestSchema)) { title }: OpenRoundRequest,
  ): Promise<OpenRoundResponse> {
    return this.openRound.execute({ roomId, token: bearerToken(authorization), title });
  }

  @Post(':roomId/rounds/:roundId/reveal')
  @HttpCode(HttpStatus.NO_CONTENT)
  reveal(
    @Param('roomId') roomId: string,
    @Param('roundId') roundId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<void> {
    return this.revealRound.execute({ roomId, roundId, token: bearerToken(authorization) });
  }

  @Post(':roomId/rounds/:roundId/re-vote')
  again(
    @Param('roomId') roomId: string,
    @Param('roundId') roundId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<OpenRoundResponse> {
    return this.reVote.execute({ roomId, roundId, token: bearerToken(authorization) });
  }

  @Put(':roomId/rounds/:roundId/estimate')
  cast(
    @Param('roomId') roomId: string,
    @Param('roundId') roundId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body(new ZodValidationPipe(castEstimateRequestSchema)) { value }: CastEstimateRequest,
  ): Promise<void> {
    return this.castEstimate.execute({
      roomId,
      roundId,
      token: bearerToken(authorization),
      value,
    });
  }

  @Put(':roomId/rounds/:roundId/final-estimate')
  settle(
    @Param('roomId') roomId: string,
    @Param('roundId') roundId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body(new ZodValidationPipe(setFinalEstimateRequestSchema)) { value }: SetFinalEstimateRequest,
  ): Promise<void> {
    return this.setFinalEstimate.execute({
      roomId,
      roundId,
      token: bearerToken(authorization),
      value,
    });
  }
}
