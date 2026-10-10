# One zod schema per payload, shared by both apps

Request and response shapes live as zod schemas in `packages/shared`. The API validates incoming payloads with them; the web app derives its types via `z.infer` and reuses the same schemas for form validation.

The alternative paths both reintroduce the drift we are trying to eliminate. Hand-written TypeScript interfaces in a shared package describe a payload without enforcing it, so runtime validation gets written separately and the two definitions diverge quietly. Class-validator DTOs are the idiomatic NestJS choice and give Swagger for free, but they are classes with decorators that a Vite frontend cannot consume, so the contract would have to be duplicated or generated through an OpenAPI codegen step that someone eventually forgets to run. A single schema makes drift impossible by construction: there is only one place to change.

## Consequences

- No automatic Swagger from DTO decorators. If API docs become worthwhile, generate them from the zod schemas rather than reintroducing a parallel DTO layer.
- `packages/shared` must stay runtime-agnostic — no Nest imports, no browser APIs — since both apps build it.
