# Planticia — Setup Guide

Complete guide to run the Planticia app from scratch.

## Prerequisites

- **Node.js** — LTS version (v20+)
- **pnpm 10.23.0** — install via Corepack:
  ```bash
  corepack enable
  corepack prepare pnpm@10.23.0 --activate
  ```
- **Supabase CLI**:
  ```bash
  brew install supabase/tap/supabase
  # or: npx supabase
  ```
- **EAS CLI** (for building APKs):
  ```bash
  npm install -g eas-cli
  ```
- **Android Studio** (for emulator) or a physical Android device
- **Expo Go** app (for quick testing) or a custom dev client

## Clone & Install

```bash
git clone <repo-url>
cd planticia
pnpm install
```

## Environment Variables — Mobile App

1. Copy the example file:
   ```bash
   cp apps/mobile/.env.example apps/mobile/.env
   ```
2. Fill in the values:
   - `EXPO_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key

   Both are found in the Supabase dashboard under **Settings → API**.

## Environment Variables — Supabase Edge Functions

### Local development

```bash
cp supabase/.env.example supabase/.env
```

Fill in the four required keys (see below).

### Production

```bash
supabase secrets set PLANTNET_API_KEY=... OPENAI_API_KEY=... PROJECT_URL=... SERVICE_ROLE_KEY=...
```

### Where to get each key

| Variable | Source |
|---|---|
| `PLANTNET_API_KEY` | [my.plantnet.org](https://my.plantnet.org/) — free, 500 identifications/day |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `PROJECT_URL` | Supabase dashboard → Settings → API |
| `SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (keep secret!) |

## Supabase Setup

1. **Link to your remote project:**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

2. **Run database migrations:**
   ```bash
   supabase db push
   ```

3. **Deploy edge functions:**
   ```bash
   supabase functions deploy --no-verify-jwt
   ```
   The `--no-verify-jwt` flag is required because the functions handle authentication internally.

4. **Enable Google OAuth:**
   In the Supabase dashboard, go to **Auth → Providers → Google** and configure your OAuth credentials (client ID and secret from Google Cloud Console).

## Running Locally

1. **Start Supabase locally** (Docker required):
   ```bash
   supabase start
   ```

2. **Start edge functions:**
   ```bash
   pnpm dev:functions
   ```

3. **Start the mobile dev server:**
   ```bash
   pnpm dev:mobile
   ```

4. **Open on a device:**
   - Scan the QR code with Expo Go, or
   - Run `pnpm android` / `pnpm ios` from `apps/mobile/`

## Building the APK

1. **Login to EAS:**
   ```bash
   eas login
   ```

2. **Build a preview APK** (internal distribution):
   ```bash
   cd apps/mobile
   eas build --platform android --profile preview
   ```

3. **Build a production APK:**
   ```bash
   cd apps/mobile
   eas build --platform android --profile production
   ```

4. **Download** the APK from the URL provided by EAS after the build completes.

5. **Install on device:**
   ```bash
   adb install <path-to-apk>
   ```
   Or transfer the file directly to the device.

## Project Structure

```
planticia/
├── apps/mobile/          # Expo/React Native app (SDK 54)
│   ├── app/              # File-based routing (Expo Router)
│   ├── components/ui/    # Reusable UI components
│   ├── libs/             # API layer (Supabase Edge Function calls)
│   └── context/          # Auth + Alert contexts
├── packages/shared/      # Shared TypeScript types
├── supabase/
│   ├── functions/        # Deno edge functions
│   │   ├── identify/     # Plant ID (PlantNet + OpenAI)
│   │   ├── diagnose-disease/  # Disease diagnosis (OpenAI Vision)
│   │   ├── get-care-tips/     # Care guide generation (OpenAI)
│   │   ├── _shared/      # Shared modules (auth, weather)
│   │   └── ...           # CRUD + notification functions
│   └── migrations/       # PostgreSQL migrations
└── SETUP.md              # This file
```

## Useful Commands

| Command | Description |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm dev:mobile` | Start Expo dev server |
| `pnpm dev:functions` | Start edge functions locally |
| `pnpm lint` | Run linter |
| `supabase start` | Start local Supabase (Docker) |
| `supabase db push` | Apply migrations to remote DB |
| `supabase functions deploy --no-verify-jwt` | Deploy all edge functions |
| `supabase functions deploy <name> --no-verify-jwt` | Deploy a single edge function |
| `eas build --platform android --profile preview` | Build preview APK |
