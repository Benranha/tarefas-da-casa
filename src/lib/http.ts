import { NextResponse } from 'next/server'

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const CODE = /^[0-9a-f]{32}$/

export const unauthorized = () => NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
export const badRequest = (msg = 'Requisição inválida') => NextResponse.json({ error: msg }, { status: 400 })
export const notFound = () => NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
