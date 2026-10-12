import { useNavigate } from 'react-router';
import { useCreateRoom } from '../shared/api/index.ts';
import { Alert } from '../shared/ui/Alert.tsx';
import { Button } from '../shared/ui/Button.tsx';
import { Heading, Lead, Screen } from '../shared/ui/Screen.tsx';
import { roomPath } from './room-path.ts';
import styles from './CreateRoomScreen.module.css';

export function CreateRoomScreen() {
  const navigate = useNavigate();
  const createRoom = useCreateRoom(({ id }) => void navigate(roomPath(id)));

  return (
    <Screen width="wide">
      <div className={styles.layout}>
        <header className={styles.hero}>
          <p className={styles.wordmark}>fibopoker</p>
          <Heading size="large">Estimate together, in Fibonacci points.</Heading>
          <Lead size="large">
            Everyone picks a number for the same task at the same time, and every Estimate is
            revealed at once — so the team talks about where it disagrees instead of agreeing with
            whoever spoke first.
          </Lead>
        </header>
        <div className={styles.invitation}>
          <Button
            variant="primary"
            size="large"
            disabled={createRoom.isCreating}
            onClick={createRoom.create}
          >
            {createRoom.isCreating ? 'Opening a Room…' : 'Create a Room'}
          </Button>
          <p className={styles.reassurance}>
            It opens straight away, and the link you land on is the Room.
          </p>
          {createRoom.failure === null ? null : (
            <Alert>The Room could not be created: {createRoom.failure}</Alert>
          )}
        </div>
        <ul className={styles.terms}>
          <li className={styles.term}>
            <h2 className={styles.termName}>No account</h2>
            <p className={styles.termBody}>
              Nobody signs in. A nickname you pick when you arrive is the whole of who you are here,
              and you can change it whenever you like.
            </p>
          </li>
          <li className={styles.term}>
            <h2 className={styles.termName}>No sign-up</h2>
            <p className={styles.termBody}>
              No email, no password, nothing to confirm and nothing to install. Everyone you send
              the link to is one click from a seat.
            </p>
          </li>
          <li className={styles.term}>
            <h2 className={styles.termName}>No limit</h2>
            <p className={styles.termBody}>
              A Room holds as many Rounds as the team keeps bringing it, and its link keeps working
              for as long as the team keeps using it.
            </p>
          </li>
        </ul>
      </div>
    </Screen>
  );
}
