// Checagem em código do texto que a IA de ajuda escreve para a criança ler (recado de tarefa devolvida,
// título de tarefa). O prompt já pede um recado curto e gentil, mas instrução no prompt pode ser ignorada:
// esta checagem não depende do modelo. Ideia adaptada do "gate" do Harvey (instrução no prompt,
// verificação no código).

// Links e endereços de e-mail não têm por que chegar a uma criança por um recado de tarefa.
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|net|org|br|io|app|me|ly|gg|xyz|info|site|online)\b(?:\/\S*)?/i
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/
// Sobras de modelo que não deveriam virar texto para a criança.
const META = /\b(?:como (?:uma )?(?:ia|intelig[eê]ncia artificial)|modelo de linguagem|instru[cç][oõ]es do sistema)\b/i

export function problemaNoTextoParaCrianca(texto: string): string | null {
  if (EMAIL.test(texto)) return 'O texto para a criança não pode ter endereço de e-mail.'
  if (LINK.test(texto)) return 'O texto para a criança não pode ter links.'
  if (META.test(texto)) return 'Reescreva o texto como o responsável falaria com a criança.'
  return null
}
