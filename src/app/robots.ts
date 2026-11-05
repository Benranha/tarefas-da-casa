import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Áreas logadas, links pessoais das crianças e APIs ficam fora dos buscadores.
const PRIVATE = [
  '/api/',
  '/pais',
  '/admin',
  '/onboarding',
  '/telefone',
  '/totem',
  '/filho',
  '/abrir',
  '/convite',
]

// Robôs de busca e de assistentes de IA liberados explicitamente (ChatGPT, Claude, Perplexity, Gemini, Copilot...).
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'DuckAssistBot',
  'meta-externalagent',
  'MistralAI-User',
  'cohere-ai',
  'YouBot',
  'CCBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: ['/', '/llms.txt'], disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
