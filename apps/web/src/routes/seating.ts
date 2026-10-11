export const TABLE_ASPECT = 1.5;

export type SeatPosition = { x: number; y: number };

const FULL_TURN = Math.PI * 2;

const RING_SAMPLES = 720;

const SAMPLE_STEP = FULL_TURN / RING_SAMPLES;

function ringSpeedAt(angle: number): number {
  return Math.hypot(TABLE_ASPECT * Math.cos(angle), Math.sin(angle));
}

function sampleLength(sample: number): number {
  return ringSpeedAt((sample + 0.5) * SAMPLE_STEP) * SAMPLE_STEP;
}

function ringPerimeter(): number {
  let perimeter = 0;

  for (let sample = 0; sample < RING_SAMPLES; sample += 1) {
    perimeter += sampleLength(sample);
  }

  return perimeter;
}

function positionAt(angle: number): SeatPosition {
  return { x: 50 + 50 * Math.sin(angle), y: 50 - 50 * Math.cos(angle) };
}

export function seatsAround<Occupant>(
  occupants: Occupant[],
): { occupant: Occupant; position: SeatPosition }[] {
  const spacing = ringPerimeter() / occupants.length;
  const seats: { occupant: Occupant; position: SeatPosition }[] = [];
  let travelled = 0;
  let nextSeatAt = 0;

  for (let sample = 0; sample < RING_SAMPLES; sample += 1) {
    const length = sampleLength(sample);
    let occupant = occupants[seats.length];

    while (occupant !== undefined && nextSeatAt < travelled + length) {
      const withinSample = (nextSeatAt - travelled) / length;

      seats.push({ occupant, position: positionAt((sample + withinSample) * SAMPLE_STEP) });
      nextSeatAt += spacing;
      occupant = occupants[seats.length];
    }

    travelled += length;
  }

  return seats;
}
