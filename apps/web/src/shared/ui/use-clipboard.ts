import { useEffect, useState } from 'react';

type CopyOutcome = 'untouched' | 'copied' | 'blocked';

type CopyAction = {
  outcome: CopyOutcome;
  copy: (text: string) => Promise<void>;
};

const FEEDBACK_MS = 2000;

export function useClipboard(): CopyAction {
  const [outcome, setOutcome] = useState<CopyOutcome>('untouched');

  useEffect(() => {
    if (outcome !== 'copied') {
      return;
    }

    const timer = window.setTimeout(() => setOutcome('untouched'), FEEDBACK_MS);

    return () => window.clearTimeout(timer);
  }, [outcome]);

  async function copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setOutcome('copied');
    } catch {
      setOutcome('blocked');
    }
  }

  return { outcome, copy };
}
