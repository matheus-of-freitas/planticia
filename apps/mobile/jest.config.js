/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  collectCoverageFrom: [
    "libs/**/*.{ts,tsx}",
    "context/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "components/ui/**/*.{ts,tsx}",
    "constants/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/index.ts",
    "!libs/supabaseClient.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm|((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@supabase/supabase-js|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))",
  ],
};
