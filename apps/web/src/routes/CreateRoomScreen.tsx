import { useNavigate } from 'react-router';
import { useCreateRoom } from '../shared/api/index.ts';
import { Button } from '../shared/ui/Button.tsx';
import { roomPath } from './room-path.ts';
import styles from './CreateRoomScreen.module.css';

export function CreateRoomScreen() {
  const navigate = useNavigate();
  const createRoom = useCreateRoom(({ id }) => void navigate(roomPath(id)));

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>fibopoker</h1>
      <p className={styles.lead}>
        Estimate tasks in Fibonacci points together. Open a Room, share its link, and vote — no
        accounts, no sign-up, and no limit on how many Rounds a Room holds.
      </p>
      <div className={styles.actions}>
        <Button variant="primary" disabled={createRoom.isCreating} onClick={createRoom.create}>
          {createRoom.isCreating ? 'Opening a Room…' : 'Create a Room'}
        </Button>
      </div>
      {createRoom.failure === null ? null : (
        <p className={styles.failure}>The Room could not be created: {createRoom.failure}</p>
      )}
    </main>
  );
}
