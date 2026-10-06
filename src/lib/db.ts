import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

// Data "de hoje" no fuso da casa (America/Manaus), calculada no banco.
export const TODAY_SQL = `(now() at time zone 'America/Manaus')::date`
