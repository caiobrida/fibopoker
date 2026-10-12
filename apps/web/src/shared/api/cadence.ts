import type { RoomSnapshot } from '@fibopoker/shared';

const LIVE_INTERVAL_MS = 1_500;
const IDLE_INTERVAL_MS = 8_000;
const BACKGROUND_INTERVAL_MS = 30_000;
const UNCHANGED_POLLS_BEFORE_IDLING = 10;

export class Cadence {
  private knownRevision: number | null = null;
  private unchangedPolls = UNCHANGED_POLLS_BEFORE_IDLING;
  private estimating = false;

  noticed(room: RoomSnapshot | null): void {
    this.estimating = room !== null && room.round !== null;

    const revision = room === null ? null : room.revision;

    if (revision === this.knownRevision) {
      this.unchangedPolls = Math.min(this.unchangedPolls + 1, UNCHANGED_POLLS_BEFORE_IDLING);

      return;
    }

    this.knownRevision = revision;
    this.unchangedPolls = 0;
  }

  interval(tabHidden: boolean): number {
    if (tabHidden) {
      return BACKGROUND_INTERVAL_MS;
    }

    return this.estimating || this.unchangedPolls < UNCHANGED_POLLS_BEFORE_IDLING
      ? LIVE_INTERVAL_MS
      : IDLE_INTERVAL_MS;
  }
}
