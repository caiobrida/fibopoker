import { Controller, Get } from '@nestjs/common';
import { DECK, type DeckValue } from '@fibopoker/shared';

@Controller()
export class AppController {
  @Get()
  contract(): { name: string; deck: readonly DeckValue[] } {
    return { name: 'fibopoker', deck: DECK };
  }
}
