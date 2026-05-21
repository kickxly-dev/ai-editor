import type { Config } from 'drizzle-kit'

const rawUrl = process.env.DATABASE_URL!
// Render Postgres requires SSL — append sslmode=require if not already present
const url = rawUrl && !rawUrl.includes('sslmode') ? `${rawUrl}?sslmode=require` : rawUrl

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
} satisfies Config
