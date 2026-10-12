import type { Participant, RevealedEstimate } from '@fibopoker/shared';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motionDuration } from '../shared/ui/motion.ts';
import { standingOfEachValue, type Standing } from './estimate-groups.ts';
import { seatsAround, type SeatPosition } from './seating.ts';

export type SeatedParticipant = {
  id: string;
  nickname: string;
  mine: boolean;
  spectating: boolean;
  hasVoted: boolean;
  estimate: string | null;
  standing: Standing;
  position: SeatPosition;
  state: 'seated' | 'vacating';
};

function seatedAround(
  participants: Participant[],
  selfId: string | null,
  revealed: RevealedEstimate[] | null,
): SeatedParticipant[] {
  const revealedTo = new Map(
    (revealed ?? []).map(({ participantId, value }) => [participantId, value]),
  );
  const standings = standingOfEachValue(revealed ?? []);

  return seatsAround(participants).map(({ occupant, position }) => {
    const estimate = revealedTo.get(occupant.id) ?? null;

    return {
      id: occupant.id,
      nickname: occupant.nickname,
      mine: occupant.id === selfId,
      spectating: occupant.spectating,
      hasVoted: occupant.hasVoted,
      estimate,
      standing: estimate === null ? 'neutral' : (standings.get(estimate) ?? 'neutral'),
      position,
      state: 'seated',
    };
  });
}

export function useSeating(
  participants: Participant[],
  selfId: string | null,
  revealed: RevealedEstimate[] | null,
): SeatedParticipant[] {
  const seated = useMemo(
    () => seatedAround(participants, selfId, revealed),
    [participants, selfId, revealed],
  );
  const [vacating, setVacating] = useState<SeatedParticipant[]>([]);
  const previouslySeated = useRef(seated);

  useLayoutEffect(() => {
    const present = new Set(seated.map(({ id }) => id));
    const departed = previouslySeated.current
      .filter(({ id }) => !present.has(id))
      .map((seat) => ({ ...seat, state: 'vacating' as const }));

    previouslySeated.current = seated;

    setVacating((current) => {
      const stillLeaving = current.filter(({ id }) => !present.has(id));

      return departed.length === 0 && stillLeaving.length === current.length
        ? current
        : [...stillLeaving, ...departed];
    });
  }, [seated]);

  useEffect(() => {
    if (vacating.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => setVacating([]), motionDuration('departure'));

    return () => window.clearTimeout(timer);
  }, [vacating]);

  return useMemo(() => {
    const present = new Set(seated.map(({ id }) => id));

    return [...seated, ...vacating.filter(({ id }) => !present.has(id))];
  }, [seated, vacating]);
}
