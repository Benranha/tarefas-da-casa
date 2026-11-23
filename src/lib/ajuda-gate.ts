// Checagem em código do texto que a IA de ajuda escreve para a criança ler (recado de tarefa devolvida,
// título de tarefa). O prompt já pede um recado curto e gentil, mas instrução no prompt pode ser ignorada:
// esta checagem não depende do modelo. Ideia adaptada do "gate" do Harvey (instrução no prompt,
// verificação no código).

// Links e endereços de e-mail não têm por que chegar a uma criança por um recado de tarefa.
const LINK =
  /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|net|org|br|io|app|me|ly|gg|xyz|info|site|online|co|be|gl|ru|tk|cc|tv|ws|link|click|top|store|shop|cloud|dev|ai|to|cn|ml|ga|cf|gq|pw)\b(?:\/\S*)?/i
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/
// Perfil de rede social (@alguem) e número de telefone ou de documento (8 ou mais dígitos, mesmo com espaços ou traços).
const PERFIL = /(?:^|[\s(])@[\p{L}\p{N}_.]{2,}/u
const NUMERO_LONGO = /(?:\d[\s().-]*){8,}/
// Sobras de modelo que não deveriam virar texto para a criança.
const META = /\b(?:como (?:uma )?(?:ia|intelig[eê]ncia artificial)|modelo de linguagem|instru[cç][oõ]es do sistema)\b/i

// Antes de conferir: letras e pontos "disfarçados" voltam ao normal e caracteres invisíveis somem
// ("exemplo[.]com", "exemplo。com" e zero-width no meio do endereço não escapam da regra).
function normalizar(texto: string): string {
  return texto
    .normalize('NFKC')
    .replace(/[\p{Cc}\p{Cf}]/gu, (c) => (c === '\n' || c === '\t' ? ' ' : ''))
    .replace(/[。｡]/g, '.')
    .replace(/\s*[[({]\s*\.\s*[\])}]\s*/g, '.')
}

export function problemaNoTextoParaCrianca(texto: string): string | null {
  const t = normalizar(texto)
  if (EMAIL.test(t)) return 'O texto para a criança não pode ter endereço de e-mail.'
  if (LINK.test(t)) return 'O texto para a criança não pode ter links.'
  if (PERFIL.test(t)) return 'O texto para a criança não pode ter nome de perfil de rede social.'
  if (NUMERO_LONGO.test(t)) return 'O texto para a criança não pode ter número de telefone nem de documento.'
  if (META.test(t)) return 'Reescreva o texto como o responsável falaria com a criança.'
  return null
}
