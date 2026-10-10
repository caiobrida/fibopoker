# Poll for Room state instead of pushing it

The frontend learns about votes, joins and reveals by polling a Room snapshot endpoint on an adaptive interval (~1.5s while a Round is open, ~8s idle, ~30s with the tab in the background), rather than over WebSocket or SSE.

Serverless was the deciding factor. With push, participants hold connections on different function instances and a vote arriving at a third instance has to reach them all — which requires a backplane (LISTEN/NOTIFY, Redis or a vendor realtime service) that is pure accidental complexity at this size. Polling has no fan-out problem at all, because Postgres is the only thing anything reads from. Vercel's Hobby plan also caps a WebSocket connection at 300s with no extension, so push would need reconnect-and-resync logic regardless. A ~1.5s delay is imperceptible when voting on story points.

Two rules keep this reversible, and they matter more than the choice itself:

1. **No Room state in process memory.** Postgres is the sole source of truth, which is what lets the same domain run unchanged behind either transport.
2. **Every snapshot carries a monotonic `revision`.** Today it keeps polling cheap; later it is what makes "send me everything since revision N" a non-breaking addition rather than a rewrite.

On the client all of this sits behind one `useRoomState(roomId)` hook, so components never know which transport is underneath.
