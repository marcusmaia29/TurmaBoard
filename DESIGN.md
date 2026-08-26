---
name: TurmaBoard
description: Um quadro acadêmico claro, calmo e confiável para a turma.
colors:
  brand-soft: "#F1F4FF"
  brand: "#4C6BFF"
  brand-deep: "#2746C7"
  ink: "#292C37"
  muted: "#676B78"
  line: "#E3E5EC"
  soft: "#F7F8FA"
  surface: "#FFFFFF"
  course-orange: "#F97316"
  course-green: "#16A344"
  course-teal: "#14B8A6"
  course-pink: "#D946A1"
  course-yellow: "#EAB308"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  sm: "0.4rem"
  md: "0.65rem"
  lg: "0.9rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  2xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 0.95rem"
    height: "2.75rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 0.95rem"
    height: "2.75rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.65rem 0.72rem"
    height: "2.75rem"
---

# Design System: TurmaBoard

## Overview

**Creative North Star: "O Quadro da Turma"**

O TurmaBoard deve parecer o quadro acadêmico que todos consultam antes da aula: claro, organizado e imediatamente confiável. A estrutura é compacta o suficiente para mostrar prioridades sem transformar a experiência em um painel corporativo denso.

A interface usa superfícies claras, linhas discretas e uma única voz azul para navegação e ações. As cores das disciplinas são funcionais e ficam restritas aos contextos de identificação; não disputam atenção com prazos, títulos ou ações.

**Key Characteristics:**

- Hierarquia direta e leitura rápida.
- Superfícies planas, contornos discretos e poucos níveis de elevação.
- Densidade acadêmica controlada, com alvos de toque de pelo menos 44px.
- Adaptação real para celular, sem depender apenas de rolagem horizontal.

## Colors

A paleta combina papel frio e tinta acadêmica com um azul de referência; as cores vivas existem somente para distinguir disciplinas.

### Primary

- **Azul de Referência:** reservado à navegação ativa, ações primárias e foco.
- **Azul Profundo:** usado em hover e texto de destaque sobre fundos claros.

### Secondary

- **Paleta das Disciplinas:** laranja, verde, turquesa, rosa, azul e amarelo identificam matérias em cards, eventos e legendas. Sempre combine cor com sigla ou nome.

### Neutral

- **Tinta Acadêmica:** texto principal e títulos.
- **Grafite Suave:** texto secundário e metadados.
- **Linha de Caderno:** divisórias, bordas e estrutura de tabelas.
- **Papel Frio:** fundo da aplicação.
- **Folha Branca:** superfícies de leitura e formulários.

### Named Rules

**The One Voice Rule.** O azul é a única cor de ação. Cores de disciplina nunca significam clique, sucesso, erro ou urgência.

**The Color Plus Label Rule.** Nunca use apenas cor para comunicar matéria, tipo, urgência ou estado; mantenha sempre sigla, nome, ícone ou texto.

## Typography

**Display Font:** Inter (com system-ui como fallback)
**Body Font:** Inter (com system-ui como fallback)

**Character:** Uma única família sem serifa mantém a leitura rápida e evita rigidez institucional. Pesos e tamanhos, não ornamentos, constroem a hierarquia.

### Hierarchy

- **Headline** (700, 1.75rem, 1.15): título único de página.
- **Title** (700, 1.1rem, 1.25): título de seção, disciplina ou diálogo.
- **Body** (400, 0.9rem, 1.6): descrições, instruções e conteúdo; limite recomendado de 68ch.
- **Label** (700, 0.75rem, 1.3): navegação, botões, chips, horários e metadados curtos.

### Named Rules

**The Read Once Rule.** Rótulos são curtos, explícitos e em português brasileiro; o usuário não deve reler uma ação para entendê-la.

## Elevation

O sistema é plano por padrão. Bordas e mudança tonal definem agrupamento; sombras suaves aparecem apenas em ferramentas, superfícies elevadas e diálogos. Elementos coloridos não recebem brilho.

### Shadow Vocabulary

- **Baixa:** `0 .25rem 1rem oklch(0.28 0.03 260 / .055)` para barras de controle e contêineres principais.
- **Elevada:** `0 .75rem 2rem oklch(0.24 0.04 260 / .13)` para menus flutuantes, toasts e diálogos.

### Named Rules

**The Flat-by-Default Rule.** Se uma borda de 1px ou uma superfície tonal resolve a hierarquia, sombra é proibida.

## Components

### Buttons

- **Shape:** cantos suavemente arredondados (`0.65rem`) e altura mínima de `2.75rem`.
- **Primary:** azul de referência, texto branco e padding horizontal de `0.95rem`.
- **Hover / Focus:** escurecimento tonal no hover e contorno visível de 3px no teclado.
- **Secondary / Ghost:** superfície branca ou transparente com borda estrutural; nunca compete com a ação primária.

### Chips

- **Style:** fundo tonal claro, texto escuro e borda opcional de 1px.
- **State:** seleção usa azul suave mais borda azul; estado nunca depende apenas da cor.

### Cards / Containers

- **Corner Style:** arredondamento de `0.9rem` nos contêineres e `0.65rem` nos cards internos.
- **Background:** folha branca sobre papel frio.
- **Shadow Strategy:** plana por padrão; sombra baixa somente quando o contêiner precisa se separar do fluxo.
- **Border:** linha de caderno de 1px.
- **Internal Padding:** entre `0.75rem` e `1.5rem`, conforme densidade.

### Inputs / Fields

- **Style:** superfície branca, borda neutra de 1px, altura mínima de `2.75rem` e cantos de `0.65rem`.
- **Focus:** borda azul e anel azul suave de 3px.
- **Error / Disabled:** texto explícito acompanha a cor; desabilitado preserva legibilidade.

### Navigation

A navegação usa ícone e rótulo no desktop. O item ativo recebe fundo azul suave e borda azul; em telas estreitas, os ícones permanecem com rótulos acessíveis.

### Grade semanal

No desktop, use uma matriz completa de cinco dias. No celular, mostre um dia por vez com seletor visível. Aulas usam preenchimento tonal; atendimentos usam fundo branco e contorno da disciplina. Horário, matéria e tipo permanecem textuais.

## Do's and Don'ts

### Do:

- **Do** priorize os prazos da semana antes de contexto secundário.
- **Do** use alvos de toque de pelo menos `2.75rem` e foco visível em toda ação.
- **Do** mantenha a mesma cor de cada disciplina em grade, calendário, quadro e legendas.
- **Do** preserve o funcionamento completo em telas pequenas com adaptação de estrutura.
- **Do** mantenha urgência e fonte oficial legíveis sem criar fadiga de alerta.

### Don't:

- **Don't** crie painéis corporativos densos ou fluxos de kanban pessoal.
- **Don't** use animação decorativa, gradientes de fundo ou brilho em elementos coloridos.
- **Don't** permita cores de disciplina competindo com ações primárias.
- **Don't** esconda ações primárias em menus ou dependa de hover para revelar informação.
- **Don't** coloque textos longos em cards de visão geral.
- **Don't** confie apenas na cor para matéria, tipo, urgência ou estado.
