import { SCOPE, baseUrl, json, resourceUrl } from '@/lib/mcp/oauth'

// Metadados que o Claude lê para descobrir como entrar (RFC 9728 e RFC 8414).

// "Este é o recurso protegido e este é o servidor que dá a chave dele."
export function metadadosDoRecurso(request: Request) {
  return json({
    resource: resourceUrl(request),
    authorization_servers: [baseUrl(request)],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'Tarefinha',
  })
}

export function metadadosDoServidor(request: Request) {
  const base = baseUrl(request)
  return json({
    issuer: base,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    revocation_endpoint: `${base}/api/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [SCOPE],
  })
}
