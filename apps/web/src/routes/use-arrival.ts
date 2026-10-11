import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RoomState } from '../shared/api/index.ts';
import { motionDuration } from '../shared/ui/motion.ts';

type Status = RoomState['status'];

export type Arrival = 'standing' | 'taking-a-seat' | 'seated';

function arrivalAfter(before: Status, now: Status): Arrival {
  if (now !== 'present') {
    return 'standing';
  }

  return before === 'unidentified' ? 'taking-a-seat' : 'seated';
}

export function useArrival(status: Status): Arrival {
  const [arrival, setArrival] = useState(() => arrivalAfter(status, status));
  const previous = useRef(status);

  useLayoutEffect(() => {
    setArrival(arrivalAfter(previous.current, status));
    previous.current = status;
  }, [status]);

  useEffect(() => {
    if (arrival !== 'taking-a-seat') {
      return;
    }

    const timer = window.setTimeout(() => setArrival('seated'), motionDuration('departure'));

    return () => window.clearTimeout(timer);
  }, [arrival]);

  return arrival;
}
