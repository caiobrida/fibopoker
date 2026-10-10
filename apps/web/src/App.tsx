import { BrowserRouter, Route, Routes } from 'react-router';
import { CreateRoomScreen } from './routes/CreateRoomScreen.tsx';
import { ROOM_ROUTE } from './routes/room-path.ts';
import { RoomScreen } from './routes/RoomScreen.tsx';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateRoomScreen />} />
        <Route path={ROOM_ROUTE} element={<RoomScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
