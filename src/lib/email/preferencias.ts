import { sql } from '@/lib/db'

// Se a família aceita dicas por e-mail. Sem linha na tabela = aceita. A preferência é da família
// (de quem criou), não de cada responsável.
export async function dicasLigadas(ownerId: string): Promise<boolean> {
  const rows = await sql`SELECT dicas FROM email_preferencias WHERE owner_id = ${ownerId}::uuid`
  return rows[0] ? Boolean(rows[0].dicas) : true
}

export async function salvarDicas(ownerId: string, dicas: boolean) {
  await sql`
    INSERT INTO email_preferencias (owner_id, dicas) VALUES (${ownerId}::uuid, ${dicas})
    ON CONFLICT (owner_id) DO UPDATE SET dicas = EXCLUDED.dicas, atualizado_em = now()
  `
}
