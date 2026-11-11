# Como escrever sobre o Tarefinha

Vale para o site, e-mails do app, avisos, WhatsApp, posts e e-mails para parceiros.

## A regra que importa

Escreva como uma pessoa de verdade mandando uma mensagem de verdade. Não como marketing, não como IA.
Leia em voz alta. Se parece anúncio, apague e comece de novo.

## Proibido

Palavras e jeitos que denunciam texto de propaganda ou de IA:

- **Travessão (—) no meio da frase.** Use ponto, vírgula ou dois-pontos.
- "Imagine se…", "E se eu te dissesse que…", "Já pensou?"
- "Revolucionário", "inovador", "incrível", "transforme sua vida", "leve para outro nível", "solução completa"
- "Espero que esteja bem", "Passando para lembrar", "Só para dar um follow-up"
- "Eu adoraria…", "Gostaria muito de…": ninguém liga para o que a gente adoraria
- "Sem compromisso", "sem pressão": chamar atenção para a pressão cria pressão
- "Últimas vagas", "só hoje", "oferta exclusiva", contagem regressiva falsa
- Lista de 3 ou mais recursos numa mesma mensagem. Escolha um.
- Mais de uma pergunta na mesma mensagem.
- Mais de um ponto de exclamação na mensagem. Nenhum é melhor.
- Começar falando de nós ("Nós do Tarefinha…", "Eu sou…"). Comece pela pessoa e pela situação dela.

Em e-mail para parceiro, também: nada de negrito, itálico, lista com marcadores ou título. E-mail de verdade é texto
corrido.

## O que funciona

- **Curto.** Mensagem para pai ou parceiro: até 75 palavras na primeira. Conte.
- **Uma ideia.** Uma observação, uma ideia, uma pergunta.
- **Sobre eles.** A situação da família (ou da escola) aparece antes do Tarefinha.
- **Concreto.** "Arrumou a cama? Ganhou ponto." é melhor que "gamificação da rotina".
- **Leitura fácil.** Frases curtas, palavras simples, nível de 7º ano.

## Por que alguém responde

Toda mensagem precisa acertar um destes gatilhos. Se não acerta nenhum, vai ser ignorada:

1. **Reconhecimento:** você descreveu o problema com as palavras dela. "Você repete 'arruma a cama' quantas vezes por
   dia?" é melhor que "pais têm dificuldade com rotina".
2. **Curiosidade de verdade:** você sabe algo que ela quer saber, e entrega quando ela responde.
3. **Sim fácil:** responder custa menos que apagar. "Isso acontece aí também?" é melhor que "Podemos marcar 30 minutos?"
4. **Prova de verdade:** algo real e público. Só se for verdade e puder ser mostrado.

## O teste antes de publicar ou enviar

1. Uma pessoa de verdade escreveria isso?
2. Tem exatamente uma ideia?
3. Está curto o bastante?
4. Eu responderia, se recebesse?
5. Tem travessão no meio de frase ou alguma coisa da lista de proibidos?
6. Toda afirmação é verdade no app de hoje? (Confira no site e no próprio app, não na memória.)
7. Está claro quem está escrevendo?

Se a 5 for sim, ou a 6 ou a 7 for não, reescreva.

## Fatos que podem ser usados (verdade hoje)

- Os pais criam as tarefas com ícone, pontos e horário opcional; elas se repetem sozinhas.
- A criança marca a tarefa no tablet da casa (totem) ou no próprio celular, com um código secreto só dela.
- Ponto só vale depois que um responsável aprova. Dá para devolver com recado.
- Os pontos viram prêmios que a família combina.
- Lembrete no celular da criança no horário da tarefa, nunca fora do período entre acordar e dormir.
- Dois responsáveis na mesma família.
- Assistente com IA que cria e aprova tarefas a partir de uma frase, sempre com confirmação.
- O painel mostra dicas aos poucos: balões "toque aqui" nos botões escondidos e cartões "Você sabia?". Dá para desligar em "Mais".
- Funciona no navegador (Android, iPhone, tablet, computador), sem loja.
- 30 dias grátis, sem cartão de crédito.

Não use: preço depois do teste (ainda não está definido no app), número de famílias usando, depoimentos, resultados
de estudos. Quando existirem de verdade, entram aqui.

## Dicas dentro do app e e-mails ao responsável

Os textos moram em três arquivos. Mude lá, não copie para outro lugar:

- `src/lib/dicas.ts`: os balões "toque aqui" e os cartões "Você sabia?" do app.
- `src/lib/email/modelos.ts`: o texto de cada e-mail.
- `src/lib/email/plano.ts`: as dicas por e-mail (`NOVIDADES`) e os limites de quando cada e-mail sai.

Além de tudo acima, vale:

- **Balão:** uma frase que aponta para um botão que existe. "Toque em Devolver para escrever um recado."
- **Cartão "Você sabia?":** o título já faz a pergunta e o texto afirma. Uma ideia e, no máximo, um botão.
- **E-mail:** uma ideia só, no máximo uma exclamação e uma pergunta (o "Você sabia?" já é a pergunta). O botão vem com uma linha logo abaixo que diz o que fazer ao tocar. Sem preço depois do teste.
- **E-mail ao responsável não traz o nome da criança.** Diga "seu filho" ou "a criança".
- **Só dica de função que existe hoje.** Confira no próprio app e em `src/lib/ajuda.ts`. Se a dica mudar uma tela ou um fluxo, atualize o `ajuda.ts` no mesmo PR.
- **Toda dica por e-mail declara** se a família já usa aquilo (`jaUsa`) e se o servidor suporta (`disponivel`). Nunca ensine o que a pessoa já faz, nem uma função que está desligada.
- **Todo e-mail de dica tem "Parar de receber".** Veja o README do kit de vendas, regra 4.

Antes de enviar qualquer e-mail novo, veja como ele fica em `npm run dev`, em `/api/dev/email` (só existe em desenvolvimento).
