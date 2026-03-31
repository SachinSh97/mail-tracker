import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Never lint build output or Prisma's generated client
  { ignores: ['dist', 'src/generated'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // Allow intentionally unused args when prefixed with "_" (e.g. Express's `_next`)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
)
