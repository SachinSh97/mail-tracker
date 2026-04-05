// Where the throwaway test Postgres runs. A fixed, unusual port so it never clashes with a real database.
export const TEST_DATABASE_PORT = 54330
export const TEST_DATABASE_NAME = 'mail_tracker_test'
export const TEST_DATABASE_URL = `postgresql://postgres:postgres@localhost:${TEST_DATABASE_PORT}/${TEST_DATABASE_NAME}`
