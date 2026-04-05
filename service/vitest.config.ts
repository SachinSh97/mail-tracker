import { defineConfig } from 'vitest/config'
import { TEST_DATABASE_URL } from './tests/setup/test-database.js'
import { TEST_SESSION_SECRET } from './tests/setup/test-users.js'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Starts a real Postgres once for the whole run, and stops it at the end
    globalSetup: ['tests/setup/global-setup.ts'],
    // Runs before every test file (fakes Google sign-in)
    setupFiles: ['tests/setup/mock-google-sign-in.ts'],
    // All test files share one database, so run them one after another
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: TEST_DATABASE_URL,
      GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
      SESSION_SECRET: TEST_SESSION_SECRET,
    },
  },
})
