import { sql } from '@/lib/db'

// Pedidos de prêmio que as crianças fizeram e esperam os pais (da própria família).
export async function listRequestedRedemptions(ownerId: string) {
  return sql`
    SELECT rr.id, rr.title, rr.cost_points, c.name AS child_name
    FROM reward_redemptions rr
    JOIN children c ON c.id = rr.child_id
    WHERE c.owner_id = ${ownerId}::uuid AND rr.status = 'requested'
    ORDER BY rr.created_at
  `
}

// Marca o prêmio como entregue.
export async function deliverRedemption(ownerId: string, id: string) {
  const rows = await sql`
    UPDATE reward_redemptions rr
    SET status = 'delivered', resolved_at = now()
    FROM children c
    WHERE rr.id = ${id}::uuid AND c.id = rr.child_id
      AND c.owner_id = ${ownerId}::uuid AND rr.status = 'requested'
    RETURNING rr.title, c.name
  `
  if (rows.length === 0) return null
  return { childName: rows[0].name as string, title: rows[0].title as string }
}
