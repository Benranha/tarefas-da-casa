# Kit de vendas do Tarefinha

Regras e roteiros para escrever sobre o Tarefinha, responder pais e abordar parceiros. Adaptado das skills de vendas
do [Harvey](https://github.com/ethanplusai/harvey) (`skills/*.md`), um agente de vendas por e-mail. O Harvey vende
para empresas (B2B); aqui as regras foram trazidas para o nosso caso: famílias brasileiras e quem fala com elas.

| Arquivo | Para quê | Vem de (Harvey) |
|---|---|---|
| [`escrita.md`](escrita.md) | Como escrever qualquer texto que pais ou crianças leem: site, e-mail, WhatsApp, post | `email_frameworks.md`, `sales_methodology.md` |
| [`cliente-ideal.md`](cliente-ideal.md) | Para quem o Tarefinha é, para quem não é, e quais parceiros valem a pena | `lead_qualification.md`, `account_navigation.md` |
| [`objecoes.md`](objecoes.md) | As dúvidas e resistências dos pais, com respostas prontas | `objection_handling.md` |
| [`oferta.md`](oferta.md) | O que oferecer em cada momento da conversa | `offer_strategy.md` |
| [`parceiros.md`](parceiros.md) | Sequência de e-mails para escolas, psicólogas e criadoras de conteúdo | `email_frameworks.md`, `signal_playbook.md` |
| [`harvey/`](harvey/) | Configuração para rodar o próprio Harvey prospectando parceiros do Tarefinha | `harvey.yaml`, `skills/product_knowledge.md` |

## As quatro regras que valem para tudo

1. **Escreva como gente.** Se, lido em voz alta, parece propaganda, reescreva.
2. **Nunca invente.** Nada de número, depoimento, "vagas limitadas" ou prazo que não existe.
3. **Não mande e-mail frio para pais.** Família só recebe mensagem nossa se pediu (cadastro, contato, indicação).
   Prospecção ativa é só com profissionais e empresas, pelo e-mail profissional deles (veja `parceiros.md`).
4. **Um "não" basta.** Pediu para parar, para. Em qualquer canal, para sempre.

### E-mails do próprio app

A regra 3 vale para prospecção. Quem já tem conta recebe as mensagens do próprio app: o link da criança, as
boas-vindas, o aviso de alguns dias sem uso e as dicas de funcionalidades (`src/lib/email/`). Isso não abre a
porta para campanha de venda, oferta ou preço. A regra 4 vale inteira: todo e-mail de dica tem "Parar de
receber" (também um interruptor em Família), vai no máximo um por semana, e quem para não recebe mais nenhum.
O envio só liga com `EMAIL_DICAS=1` (veja o README do projeto).
