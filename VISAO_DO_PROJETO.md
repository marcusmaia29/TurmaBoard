# TurmaBoard — Visão do Projeto

> [!NOTE]
> Este é o briefing original do produto e preserva decisões consideradas no
> início do projeto. Para o comportamento atual, consulte `PRODUCT.md`,
> `docs/ARCHITECTURE.md`, `docs/DATABASE.md` e as migrations versionadas.
>
> Documento de orientação funcional e de produto.
>
> Este arquivo explica o propósito do TurmaBoard, a experiência esperada e o escopo da primeira versão. Decisões de tecnologia, arquitetura e infraestrutura devem ser documentadas separadamente pelo responsável pela implementação.

## 1. Resumo

O **TurmaBoard** é uma central acadêmica colaborativa para organizar as informações importantes de um semestre universitário.

A ideia é reunir, em um único lugar, entregas, provas, quizzes, APS, projetos, atividades, avisos, links e anotações das disciplinas. Assim, os alunos não precisam procurar informações espalhadas entre grupos de mensagens, plataformas acadêmicas, e-mails e páginas diferentes.

O sistema deve ser rápido de consultar, simples de atualizar e fácil de entender mesmo para alguém que esteja acessando pela primeira vez.

## 2. Problema que queremos resolver

Durante o semestre, cada disciplina pode divulgar informações em um lugar diferente. É comum que:

- uma data importante apareça apenas no grupo da turma;
- uma atividade esteja publicada em uma plataforma acadêmica;
- um link seja enviado durante a aula;
- um prazo seja alterado e nem todos percebam;
- alunos diferentes mantenham calendários e anotações separados;
- informações importantes se percam no histórico de mensagens.

O TurmaBoard busca criar uma **fonte de consulta compartilhada da turma**, sem substituir os canais oficiais das disciplinas.

Ele organiza e aponta para as informações oficiais, mas não deve ser tratado como autoridade superior ao professor ou à plataforma acadêmica.

## 3. Objetivo principal

Ao entrar no TurmaBoard, um aluno deve conseguir responder rapidamente:

1. O que precisamos entregar nesta semana?
2. Qual é o prazo de cada item?
3. A qual disciplina ele pertence?
4. Onde encontro a atividade ou sua fonte oficial?
5. Quem adicionou ou alterou essa informação?
6. Quais são os links e anotações importantes de cada disciplina?

Idealmente, essas respostas devem ser encontradas em poucos segundos.

## 4. Público do projeto

O público inicial é uma única turma de graduação durante um semestre.

Os usuários mais comuns serão:

- alunos que apenas consultam as próximas entregas;
- alunos que colaboram adicionando ou corrigindo informações;
- uma ou mais pessoas que administram o espaço da turma.

O sistema deve ser compreensível para usuários sem conhecimento técnico.

## 5. Conceito central

O TurmaBoard não é um gerenciador individual de tarefas.

Ele representa a **agenda coletiva da turma**. Uma entrega cadastrada pertence à turma, e não a um aluno específico.

Por esse motivo, na primeira versão:

- as colunas do quadro representam disciplinas;
- os cartões representam entregas, atividades ou avisos;
- os tipos aparecem como etiquetas, por exemplo `Quiz`, `Prova`, `APS` e `Projeto`;
- não existe o fluxo pessoal “A fazer”, “Fazendo” e “Concluído”;
- um aluno não marca uma entrega coletiva como concluída para todos.

Um acompanhamento individual poderá ser considerado no futuro, separado da agenda compartilhada.

## 6. Princípios da experiência

### Simplicidade

O sistema deve mostrar primeiro o que é mais importante. Informações complementares podem aparecer ao abrir um cartão ou uma disciplina.

### Consulta rápida

A tela inicial deve permitir identificar prazos e prioridades sem exigir vários cliques.

### Colaboração responsável

As pessoas autorizadas podem contribuir, mas toda alteração precisa indicar quem a realizou.

### Uma única informação, várias visualizações

Uma entrega cadastrada deve aparecer automaticamente no quadro, no calendário e na página da disciplina. Não devem existir cópias independentes da mesma entrega.

### Transparência

Datas e conteúdos podem ser corrigidos. O histórico deve ajudar a entender o que foi alterado e por quem.

### Boa experiência no celular

Grande parte das consultas será feita rapidamente pelo celular. A interface precisa continuar clara e utilizável em telas menores.

## 7. Navegação principal

A primeira versão terá quatro áreas principais:

1. **Semana**
2. **Calendário**
3. **Disciplinas**
4. **Histórico**

O protótipo visual que acompanha este documento está em [`turmaboard-prototipo.html`](./turmaboard-prototipo.html).

O protótipo serve como referência de aparência, hierarquia e organização da tela. Os nomes das disciplinas e os conteúdos exibidos nele são ilustrativos e podem ser substituídos.

## 8. Tela “Semana”

Esta é a tela principal do TurmaBoard.

Ela deve exibir claramente o intervalo da semana selecionada, por exemplo:

> 24/08 a 28/08

O usuário deve poder:

- visualizar a semana atual;
- navegar para a semana anterior;
- navegar para a próxima semana;
- retornar rapidamente à semana atual;
- filtrar os cartões pelo tipo de atividade;
- abrir os detalhes de um cartão;
- adicionar uma nova informação, se tiver permissão.

### Organização do quadro

Cada coluna representa uma disciplina.

Exemplo:

| Machine Learning | Linguagens e Paradigmas | Disciplina 3 | Disciplina 4 |
| --- | --- | --- | --- |
| Quiz 02 | Lista de exercícios | APS 01 | Apresentação |
| Checkpoint do projeto | Quiz de structs | Aviso de aula | Entrega do projeto |

Dentro de cada coluna, os cartões devem ser ordenados pelo prazo mais próximo.

Quando uma disciplina não possuir itens na semana selecionada, deve existir um estado vazio simples, sem deixar a coluna visualmente quebrada.

### Filtros

O quadro deve permitir visualizar todos os cartões ou apenas determinados tipos:

- Provas;
- Projetos;
- APS;
- Quizzes;
- Atividades;
- Avisos.

Os filtros não alteram os dados cadastrados. Eles apenas controlam o que está visível naquele momento.

## 9. Cartão de entrega

Cada cartão deve apresentar apenas as informações necessárias para a consulta rápida:

- tipo;
- título;
- disciplina, quando necessário;
- descrição curta;
- data e horário do prazo;
- indicação de urgência ou atraso;
- autor da última atualização;
- link ou fonte, quando existir.

Ao abrir o cartão, o usuário poderá ver os detalhes completos.

### Tipos iniciais

Os tipos disponíveis na primeira versão serão:

- `Quiz`;
- `Prova`;
- `APS`;
- `Projeto`;
- `Atividade`;
- `Aviso`.

Cada tipo deve possuir uma etiqueta visualmente identificável. A cor principal da coluna, entretanto, representa a disciplina.

### Situação do prazo

O cartão deve diferenciar visualmente:

- prazo futuro normal;
- prazo próximo ou urgente;
- prazo vencido.

Uma entrega vencida não deve desaparecer imediatamente. Ela continua disponível na semana correspondente e no histórico.

## 10. Cadastro e edição de uma entrega

Ao adicionar ou editar uma entrega, devem ser informados:

- título;
- disciplina;
- tipo;
- data;
- horário;
- descrição, quando necessária;
- link ou fonte, quando existir.

O preenchimento deve ser rápido. Título, disciplina, tipo e prazo são informações obrigatórias.

Depois de salvar:

- o cartão deve aparecer na disciplina e na semana corretas;
- o calendário deve ser atualizado automaticamente;
- a alteração deve ser registrada no histórico;
- a interface deve informar que a operação foi concluída.

Antes de remover uma informação, o sistema deve pedir confirmação.

## 11. Tela “Calendário”

O calendário oferece outra forma de visualizar as mesmas entregas cadastradas no quadro.

Ele deve permitir:

- visualizar as entregas distribuídas pelos dias do mês;
- navegar entre meses;
- identificar a disciplina pela cor;
- abrir os detalhes de uma entrega;
- perceber dias com maior concentração de prazos.

O calendário não deve possuir cadastros independentes. Quando uma entrega é criada, editada ou removida no sistema, todas as visualizações devem refletir a mudança.

## 12. Tela “Disciplinas”

Esta área funciona como um bloco de referência compartilhado de cada disciplina.

O usuário escolhe uma disciplina e encontra:

- nome e identificação da disciplina;
- site oficial;
- página da plataforma acadêmica;
- repositório de código, quando existir;
- links importantes;
- anotações gerais;
- datas ou orientações recorrentes;
- autor e horário da última atualização.

As anotações devem ser simples. A primeira versão não precisa de um editor de texto avançado.

O objetivo não é substituir materiais oficiais, mas facilitar o acesso a eles e preservar informações práticas compartilhadas durante o semestre.

## 13. Tela “Histórico”

O histórico registra as alterações relevantes feitas no espaço da turma.

Cada registro deve informar:

- quem realizou a ação;
- o que foi criado, editado ou removido;
- qual informação foi afetada;
- data e horário;
- resumo da alteração, quando fizer sentido.

Exemplos:

> Marcus adicionou “Quiz 02 — Regressão linear” em Machine Learning.

> Ana alterou o prazo da APS 01 de 27/08 às 18:00 para 28/08 às 23:59.

> Rafael atualizou os links de Linguagens e Paradigmas.

O histórico existe para aumentar a confiança no conteúdo e facilitar a correção de erros. Ele não deve ser apresentado como uma ferramenta de vigilância ou pontuação dos colaboradores.

## 14. Acesso e permissões

A experiência desejada combina consulta rápida com proteção contra alterações anônimas.

### Visitante

Pode consultar as informações básicas do quadro e do calendário, como título, disciplina, tipo e prazo.

### Colaborador autenticado

Pode consultar detalhes internos, acessar links e anotações e criar ou editar informações.

### Administrador

Pode gerenciar participantes, corrigir ou remover conteúdo e cuidar do espaço da turma.

Toda criação, edição ou remoção precisa estar associada a uma pessoa identificada.

Caso a autenticação não faça parte da primeira entrega técnica, a aplicação pode simular esses papéis durante o desenvolvimento, mas a regra de produto deve ser preservada.

## 15. Exemplo de uso

Uma aluna descobre durante a aula que o prazo de uma APS será na sexta-feira às 23:59.

Ela acessa o TurmaBoard, seleciona “Adicionar entrega” e informa:

- título: APS 01 — API REST;
- disciplina: Desenvolvimento Web;
- tipo: APS;
- prazo: sexta-feira às 23:59;
- descrição: implementar endpoints, testes e documentação;
- fonte: link da atividade oficial.

Depois de salvar:

1. a APS aparece na coluna de Desenvolvimento Web;
2. o cartão fica posicionado de acordo com o prazo;
3. a APS aparece no calendário;
4. o histórico registra quem adicionou a informação;
5. os demais alunos conseguem consultá-la.

Se o prazo mudar, alguém autorizado pode editar o cartão, e a mudança também fica registrada.

## 16. Escopo da primeira versão

A primeira versão deve entregar uma experiência funcional e coerente, contendo:

- quadro semanal;
- navegação entre semanas;
- disciplinas como colunas;
- filtros por tipo;
- criação, edição e remoção de entregas;
- calendário;
- página de links e anotações por disciplina;
- histórico de alterações;
- identificação do autor das mudanças;
- tratamento de estados vazios e prazos vencidos;
- funcionamento adequado em desktop e celular.

Dados de exemplo podem ser utilizados enquanto ainda não existir armazenamento permanente.

## 17. Fora do escopo inicial

Não fazem parte da primeira versão:

- acompanhamento pessoal de tarefas concluídas;
- chat;
- comentários em cartões;
- notificações por WhatsApp;
- integração automática com plataformas acadêmicas;
- integração com Google Calendar ou Outlook;
- upload e armazenamento de arquivos;
- aplicativo mobile nativo;
- gamificação;
- inteligência artificial;
- controle de notas e médias;
- substituição das fontes oficiais das disciplinas.

Essas possibilidades podem ser avaliadas depois que o uso básico for validado com a turma.

## 18. O que deve ser priorizado

Se for necessário reduzir o escopo durante a implementação, a ordem de prioridade é:

1. consulta das entregas da semana;
2. cadastro e edição de entregas;
3. organização por disciplina e prazo;
4. calendário;
5. anotações e links das disciplinas;
6. histórico completo;
7. refinamentos visuais.

Uma versão simples e confiável é mais importante do que uma versão extensa e incompleta.

## 19. Critérios de sucesso

Consideraremos que a primeira versão cumpre seu objetivo quando:

- um aluno consegue identificar as entregas da semana em poucos segundos;
- uma nova entrega pode ser adicionada sem treinamento;
- a mesma informação aparece corretamente no quadro, calendário e disciplina;
- alterações indicam quem as realizou;
- prazos urgentes e vencidos são fáceis de perceber;
- a aplicação continua utilizável no celular;
- outro aluno consegue entender o sistema apenas navegando pela interface;
- a turma percebe vantagem em consultar o TurmaBoard em vez de procurar informações em vários canais.

## 20. Diretrizes visuais

O visual deve transmitir organização e leveza.

Preferências:

- fundo claro;
- cartões brancos;
- bordas suaves;
- sombras discretas;
- uma cor por disciplina;
- etiquetas por tipo de entrega;
- tipografia legível;
- poucos elementos por tela;
- ações importantes fáceis de encontrar;
- boa hierarquia entre título, prazo e informações secundárias.

Evitar:

- excesso de animações;
- telas muito carregadas;
- muitas cores competindo entre si;
- textos longos dentro dos cartões;
- funções escondidas sem necessidade;
- aparência de sistema corporativo complexo.

## 21. Referência visual

O arquivo [`turmaboard-prototipo.html`](./turmaboard-prototipo.html) demonstra a direção visual esperada para a tela inicial.

Ele contém:

- cabeçalho e navegação;
- seleção de semana;
- filtros;
- disciplinas em colunas;
- exemplos de cartões;
- formulário de nova entrega;
- estados iniciais das demais áreas.

O protótipo não define obrigatoriamente a tecnologia, a estrutura interna do código ou o conteúdo final. Ele deve ser utilizado como referência de produto e interface.

## 22. Decisões que ainda podem evoluir

Alguns pontos poderão ser definidos após os primeiros testes com a turma:

- nome definitivo da aplicação;
- disciplinas e cores oficiais do semestre;
- quais informações podem ser vistas sem autenticação;
- quantidade de administradores;
- necessidade de validação de uma informação por outro aluno;
- comportamento de semanas com entregas no sábado ou domingo;
- tempo durante o qual entregas vencidas permanecem em destaque;
- necessidade futura de acompanhamento pessoal.

Essas decisões não devem impedir a criação da primeira versão.

---

## Em uma frase

**O TurmaBoard deve ser o lugar mais rápido e confiável para a turma descobrir o que precisa ser entregue, quando e onde encontrar a informação correta.**
