import { DECK } from '@fibopoker/shared';

export function App() {
  return (
    <main>
      <h1>fibopoker</h1>
      <ul>
        {DECK.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </main>
  );
}
