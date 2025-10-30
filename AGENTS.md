# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Expo Router routes; folders such as `(council)`, `(student)`, and `auth/` define navigation stacks. Keep screen logic, loaders, and route-specific hooks within the matching folder.
- `src/` holds shared code: `api/` for Axios services, `auth/` for session helpers, `screens/` for state managers, `design/` for tokens, `utils/` for pure helpers, and `components/` for feature widgets. Global UI primitives stay in the root-level `components/`.
- Store packaged media in `assets/` and reference paths through `app.json` to keep Expo builds consistent.

## Build, Test, and Development Commands
- `npm run start`: Launch Metro plus Expo Router; add `-- --clear` if bundler caches misbehave.
- `npm run android|ios|web`: Start the bundler and open the platform target. Run each in its own terminal tab for cleaner logs.
- `npm run lint`: Execute the Expo ESLint preset. Fix or justify every warning before requesting review.
- `npm run reset-project`: Regenerate a clean `app/`; avoid on shared branches because it overwrites local routes.

## Coding Style & Naming Conventions
- Prefer `.ts`/`.tsx` files; reserve `.js` for configuration and scripts.
- Follow the Expo ESLint defaults (see `eslint.config.js`): 2-space indentation, sorted imports, and no unused exports.
- Use PascalCase for components, prefix hooks with `use`, keep utilities camelCase, and name files in `app/` with kebab-case so Expo Router matches paths.

## Testing Guidelines
- Jest is not yet configured. Stage new specs as `<name>.test.ts[x]` beside the source or inside `src/__tests__/`, using `@testing-library/react-native` for UI behavior once the harness is introduced.
- Until automation lands, document manual smoke coverage in each PR. Run `npm run start` and verify critical flows on Android, iOS, and web before merging.

## Commit & Pull Request Guidelines
- Mirror the existing history format: `<type> : <summary>` (for example `feat : 달력 날짜 클릭시 상세보기`). Keep messages under 72 characters and separate unrelated changes.
- Pull requests should include a concise summary, linked issues, screenshots or recordings for UI updates, and the list of manual or automated checks. Request review from an owner of the touched module and wait for green lint/test runs.

## Security & Configuration Tips
- Do not commit secrets; rely on Expo config plugins or build-time environment injection.
- When adding config keys, update both `app.json` and `expo-env.d.ts` so TypeScript surfaces the new values across the codebase.
