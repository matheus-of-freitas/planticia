# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (uses pnpm workspaces)
pnpm install

# Start mobile dev server
pnpm dev:mobile

# Start Supabase Edge Functions locally
pnpm dev:functions          # or: supabase functions serve

# Lint
pnpm lint

# Platform-specific (from apps/mobile/)
pnpm start                  # Expo dev server
pnpm android                # Run on Android
pnpm ios                    # Run on iOS
pnpm web                    # Run on web
```

## Architecture

**Monorepo** using Turborepo + pnpm workspaces (pnpm 10.23.0).

### Workspace Layout

- `apps/mobile/` — Expo/React Native app (SDK 54, React 19, React Native 0.81)
- `packages/shared/` — Shared TypeScript types (e.g., `Plant` interface)
- `supabase/` — Backend: Edge Functions (Deno), migrations, config

### Mobile App (`apps/mobile/`)

**Routing**: Expo Router (file-based) in `app/` directory with grouped route segments:
- `(auth)/` — Login screen (Google OAuth via Supabase Auth)
- `(plants)/` — Plant identification, details, add flow
- `(diagnosis)/` — AI disease diagnosis
- `(tips)/` — Care tips display
- `index.tsx` — Home screen (plant list)

**State**: React Context for auth (`context/AuthContext.tsx`); local state elsewhere. No Redux or external state library.

**API layer** (`libs/`): Each file wraps a call to a Supabase Edge Function — `identifyPlant.ts`, `diagnosePlant.ts`, `savePlant.ts`, `getCareTips.ts`, `uploadImage.ts`, `deletePlant.ts`, `notifications.ts`.

**UI components** (`components/ui/`): Button, Card, Screen, FAB, EmptyState, etc. Theme tokens in `constants/theme.ts` (colors, typography, spacing, shadows).

### Backend (Supabase Edge Functions)

All in `supabase/functions/`, Deno-based:
- `identify` — Plant ID via PlantNet API (image → species) + OpenAI GPT-4o-mini (species → care info)
- `diagnose-disease` — Disease diagnosis via OpenAI GPT-4o vision
- `get-care-tips` — Care guide generation via OpenAI GPT-4o (cached in `care_tips` table)
- `plant-create`, `list-plants`, `update-plant`, `delete-plant` — CRUD
- `update-notification` — Links notification IDs to plants

### Key Patterns

- **Image pipeline**: Capture → compress/resize via ImageManipulator → Base64 → PlantNet/OpenAI APIs → upload to Supabase Storage
- **Notifications**: Local-only via `expo-notifications`. Scheduled on plant creation, rescheduled on watering, cancelled on deletion. Android uses a "watering-reminders" channel.
- **AI responses**: All OpenAI prompts use `response_format: { type: "json_object" }` for strict JSON. PlantNet returns structured JSON natively. App language is Portuguese (BR). Prompts are tailored to Rio de Janeiro's climate (Köppen Aw).
- **Database**: PostgreSQL via Supabase with RLS policies scoping data to `user_id`. Main tables: `plants`, `care_tips`, `plant_care_schedules`, `articles`.

## Environment Variables

Mobile (`.env`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Edge Functions (Supabase secrets): `PLANTNET_API_KEY`, `OPENAI_API_KEY`, `PROJECT_URL`, `SERVICE_ROLE_KEY`
