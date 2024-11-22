## What changed

## Why

## Testing

- [ ] `npm run test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Tested manually against a local Postgres + `npm run worker:watch`, if this touches the
      build runner or deploys
- [ ] Tested manually against `npm run alert-check:watch`, if this touches alert evaluation
- [ ] Ran `npm run db:generate` and committed the resulting migration, if this touches
      `src/lib/db/schema.ts`
