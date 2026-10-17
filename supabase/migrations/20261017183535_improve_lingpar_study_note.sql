begin;

do $update_note$
begin
  update public.lesson_notes
  set content = $lingpar_revision$# Linguagens e Paradigmas — mega resumo visual

**Guia de estudo para a avaliação final de 2026/1 · TEOR + COMP**

Este material segue uma trilha: primeiro, como descrevemos linguagens; depois, o que uma máquina consegue reconhecer ou decidir; por fim, quanto custam os algoritmos e como um compilador transforma código. Os exemplos são de estudo, não respostas de avaliações anteriores.

> **Como estudar:** leia a intuição, confira a definição, percorra o diagrama e tente explicar o exemplo sem olhar. Nas fórmulas, identifique o significado de cada símbolo antes de memorizar.

## Roteiro de leitura

1. [**TEOR · Linguagens formais**](#note-heading-teor-linguagens-formais): gramáticas, Chomsky, autômatos e bombeamento.
2. [**TEOR · Computabilidade e decidibilidade**](#note-heading-teor-computabilidade-e-decidibilidade): máquinas de Turing, Rec/RE, parada e diagonalização.
3. [**TEOR · Funções, paradigmas e complexidade**](#note-heading-teor-funcoes-paradigmas-e-complexidade): cálculo lambda, P/NP, espaço e tipos.
4. [**COMP · Do código-fonte ao executável**](#note-heading-comp-do-codigo-fonte-ao-executavel): lexer, parser, AST, semântica, funções e Assembly.
5. [**Revisão de véspera**](#note-heading-revisao-de-vespera): fórmulas, exercícios resolvidos e checklist.

**Atalhos para dúvidas frequentes:** [Chomsky](#note-heading-2-hierarquia-de-chomsky) · [Rec × RE](#note-heading-7-reconhecer-e-diferente-de-decidir) · [P e NP](#note-heading-12-p-np-e-reducoes) · [Pipeline do compilador](#note-heading-15-visao-geral-e-evolucao-do-projeto) · [Gabarito comentado](#note-heading-25-gabarito-comentado).

```mermaid
flowchart LR
  A[Alfabeto e cadeias] --> B[Gramáticas e linguagens]
  B --> C[Chomsky e reconhecedores]
  C --> D[Computabilidade e decidibilidade]
  D --> E[Complexidade]
  B --> F[Lexer e parser]
  F --> G[AST e semântica]
  G --> H[Assembly]
```

---

# TEOR · Linguagens formais

**Em um minuto:** gramáticas geram cadeias; autômatos as reconhecem. O tipo de memória disponível separa as classes regular, livre de contexto e sensível ao contexto. Para classificar uma linguagem, mostre um reconhecedor e justifique por que uma classe menor não basta.

## 1. Do alfabeto à gramática

**Intuição.** Um alfabeto fornece as peças, cadeias organizam as peças, uma linguagem escolhe quais cadeias são válidas e uma gramática dá regras para produzi-las.

**Definições.** Um alfabeto $\Sigma$ é finito e não vazio. Uma cadeia é uma sequência finita de símbolos de $\Sigma$; $\varepsilon$ é a cadeia vazia. $\Sigma^*$ contém todas as cadeias finitas, inclusive $\varepsilon$; $\Sigma^+=\Sigma^*\setminus\{\varepsilon\}$. Uma linguagem formal é qualquer $L\subseteq\Sigma^*$.

**Exemplo progressivo.** Para $\Sigma=\{a,b\}$, as cadeias $\varepsilon$, `a`, `ab` e `baba` pertencem a $\Sigma^*$. A linguagem $L=\{a^nb^n\mid n\geq0\}$ aceita $\varepsilon$, `ab` e `aabb`, mas rejeita `abab`.

Uma gramática é $G=(V,\Sigma,P,S)$, com vocabulário $V$, terminais $\Sigma$, produções $P$ e símbolo inicial $S$. Convém escrever $N=V\setminus\Sigma$ para os não terminais. Em $S\to aSb\mid\varepsilon$, a derivação $S\Rightarrow aSb\Rightarrow aaSbb\Rightarrow aabb$ mostra a construção de uma cadeia. A **árvore de derivação** registra qual produção gerou cada parte; uma gramática é ambígua quando uma mesma cadeia admite árvores sintáticas diferentes.

| Representação | Pergunta que responde | Uso típico |
|---|---|---|
| Gramática / BNF / EBNF | Como formar cadeias válidas? | Sintaxe de linguagens e parsers |
| Expressão regular | Que padrão local se repete? | Tokens e linguagens regulares |
| Autômato | Como reconhecer durante a leitura? | Reconhecimento operacional |
| Máquina de Turing | Qual procedimento efetivo executa a tarefa? | Computabilidade |

**Não confunda:** a gramática *gera* cadeias; o reconhecedor *recebe* uma cadeia e verifica pertinência. EBNF acrescenta abreviações como repetição e opcionalidade, sem mudar por si só a classe da linguagem descrita.

> **Memorize:** $L\subseteq\Sigma^*$; $\varepsilon$ tem comprimento zero; uma derivação começa em $S$ e termina só com terminais.

## 2. Hierarquia de Chomsky

Cada nível restringe a forma das produções e se associa a um modelo de reconhecimento. As inclusões são **próprias**: há linguagens no nível maior que não estão no menor.

| Tipo | Classe | Produção característica | Reconhecedor | Exemplo separador |
|---|---|---|---|---|
| 3 | Regular | Linear à direita ou à esquerda | Autômato finito | $a^*b^*$ |
| 2 | Livre de contexto (LC) | $A\to\alpha$ | Autômato de pilha não determinístico | $\{a^nb^n\}$ |
| 1 | Sensível ao contexto (SC) | Não contrativa, com exceção controlada para $\varepsilon$ | Máquina de Turing linearmente limitada (LBA) | $\{a^nb^nc^n\mid n\geq1\}$ |
| 0 | Recursivamente enumerável (RE) | Irrestrita, lado esquerdo com não terminal | Máquina de Turing | Problema de aceitação de MT |

$$L_{Reg}\subsetneq L_{LC}\subsetneq L_{SC}\subsetneq L_{Rec}\subsetneq L_{RE}\subsetneq\mathcal P(\Sigma^*).$$

`Rec` significa **linguagens recursivas ou decidíveis**. É uma classe intermediária importante, mas não um quinto tipo da classificação original. Fora de RE existem linguagens sem reconhecedor de Turing.

```mermaid
flowchart TB
  subgraph ALL["Todas as linguagens sobre Σ"]
    OUT["Existem linguagens fora de RE"]
    subgraph RE["Tipo 0 · RE"]
      subgraph REC["Decidíveis · Rec"]
        subgraph SC["Tipo 1 · SC"]
          subgraph LC["Tipo 2 · LC"]
            REG["Tipo 3 · Regulares"]
          end
        end
      end
    end
  end
```

Cada moldura contém a classe dentro dela; `Rec` é uma classe intermediária, não um tipo extra de Chomsky. A caixa fora de RE continua dentro do conjunto de todas as linguagens.

**Conexão:** o compilador usa expressões regulares para tokens e gramáticas livres de contexto para a estrutura sintática; a semântica exige verificações adicionais.

## 3. Regulares: memória finita

Um autômato finito decide usando apenas um estado entre um número finito de possibilidades. Formalmente, um AFD é $M=(Q,\Sigma,\delta,q_0,F)$: estados, alfabeto, transição, estado inicial e estados finais. Lê a entrada inteira e aceita se terminar em $F$. AFN pode ter várias escolhas; AFN com transições $\varepsilon$ pode mudar de estado sem consumir símbolo. AFD, AFN e AFN-$\varepsilon$ reconhecem **a mesma classe**, embora suas construções possam ter tamanhos diferentes.

Para $L=\{a^mb^n\mid m,n\geq0\}$, a expressão é $a^*b^*$: depois de começar os `b`, um `a` invalida a cadeia. Gramáticas lineares à direita usam, por exemplo, $A\to wB$; à esquerda, $A\to Bw$. Manter a orientação consistente importa na conversão para autômatos.

```mermaid
flowchart LR
  I(("início")) --> q0@{ shape: dbl-circ, label: "q0 · aceita" }
  q0 -->|a| q0
  q0 -->|b| q1@{ shape: dbl-circ, label: "q1 · aceita" }
  q1 -->|b| q1
  q1 -->|a| morto(("morto"))
  morto -->|a, b| morto
```

As bordas duplas marcam `q0` e `q1` como estados de aceitação. O estado morto rejeita. Assim, `ε`, `a` e `ab` são aceitas; `ba` chega ao estado morto.

**Lema do bombeamento regular.** Se $L$ é regular, existe $p$ tal que toda $w\in L$ com $|w|\geq p$ admite $w=xyz$, com $\lvert y\rvert>0$, $|xy|\leq p$ e $xy^iz\in L$ para todo $i\geq0$. Para provar que $\{a^nb^n\}$ não é regular, escolha $w=a^pb^p$. Qualquer $y$ permitido só contém `a`; bombeá-lo altera a quantidade de `a` sem alterar a de `b`.

> **Erro comum:** encontrar *uma* divisão que bombeia não prova regularidade. O lema fornece uma condição necessária, e a prova de não regularidade deve vencer **todas** as divisões permitidas.

## 4. Livres de contexto: memória em pilha

Uma gramática LC tem produções $A\to\alpha$, em que $A$ é um único não terminal. Para $\{a^nb^n\mid n\geq0\}$, use $S\to aSb\mid\varepsilon$. O autômato de pilha acrescenta uma pilha ao controle finito: empilha um marcador por `a` e desempilha um por `b`.

$$M=(Q,\Sigma,\Gamma,\delta,q_0,Z_0,F).$$

$\Gamma$ é o alfabeto da pilha e $Z_0$ é seu marcador inicial. Aceitação por estado final e por pilha vazia são convenções equivalentes para **AP não determinísticos**, com conversões adequadas. Determinismo restringe o poder: nem toda LC é determinística.

```mermaid
flowchart LR
  A["Entrada: aaabbb"] --> B["Ler a: empilhar A, A, A"]
  B --> C["Ler b: retirar A, A, A"]
  C --> D["Entrada consumida e pilha no marcador inicial: aceitar"]
```

**Lema do bombeamento LC.** Para linguagens LC, uma cadeia suficientemente longa admite $z=uvwxy$ com $\lvert vx\rvert>0$, $|vwx|\leq p$ e $uv^iwx^iy\in L$ para todo $i\geq0$. Duas regiões são bombeadas juntas. Isso ajuda a mostrar que $\{a^nb^nc^n\}$ não é LC: uma janela de tamanho até $p$ não pode cobrir os três blocos completos da cadeia $a^pb^pc^p$; o bombeamento rompe alguma igualdade ou a ordem.

**Parsing.** LL($k$) percorre a derivação da esquerda para a direita, construindo uma derivação à esquerda com $k$ símbolos de antecipação; costuma ser *top-down*. LR($k$) lê da esquerda para a direita e reconstrói uma derivação à direita ao contrário; é *bottom-up* e usa decisões como `shift` e `reduce`. Ambiguidade impede escolher uma única árvore sintática sem uma convenção adicional.

> **Mini revisão:** AF lembra estados; AP lembra uma sequência aninhada. Pergunte qual informação a linguagem exige guardar durante a leitura.

## 5. Sensíveis ao contexto: fita limitada

As regras de uma gramática SC podem ser apresentadas na forma não contrativa $\alpha\to\beta$, com $\alpha\in V^*NV^*$, $\beta\in V^*$ e $|\alpha|\leq|\beta|$. Há uma exceção técnica controlada para gerar $\varepsilon$ a partir do símbolo inicial, que não pode aparecer no lado direito das produções sob a convenção usual.

O exemplo central é $L=\{a^nb^nc^n\mid n\geq1\}$. `abc`, `aabbcc` e `aaabbbccc` pertencem; `aabbc`, `aabbbccc` e `ababcc` não. É preciso conferir a ordem **e** igualar três contagens. Uma LBA marca, a cada rodada, um `a`, um `b` e um `c` ainda não marcados.

```mermaid
flowchart TB
  A["aaabbbccc"] --> B["XaabYbcZc"]
  B --> C["XXaYYbZZc"]
  C --> D["XXXYYYZZZ"]
  D --> E["Verificar ausência de símbolos sem marca e ordem correta"]
```

Uma LBA pode ler e escrever em um trecho de fita limitado linearmente pelo tamanho da entrada. Para uma entrada fixa, há um número finito de configurações. Uma simulação ingênua **pode** repetir uma configuração e entrar em ciclo; para decidir a linguagem, detectamos repetição ou exploramos esse espaço finito. Por isso toda SC é decidível.

As linguagens SC são fechadas por união, concatenação, interseção, complemento e estrela de Kleene, sob a definição matemática usual. **Ressalva da disciplina:** uma tabela das notas de aula diverge sobre a estrela; confira a convenção cobrada pelo docente e registre a divergência em vez de presumir que a tabela está correta.

---

# TEOR · Computabilidade e decidibilidade

**Em um minuto:** reconhecer exige parar e aceitar nos casos positivos; decidir exige também parar e rejeitar nos negativos. Uma máquina de Turing pode ter memória irrestrita, mas isso não implica que todo problema seja decidível.

## 6. Máquina de Turing

Uma MT combina controle finito com fita de leitura e escrita e cabeçote móvel. A notação usada na disciplina é $M=(Q,\Sigma,\Gamma,\delta,q_0,<,B,F)$, com delimitador esquerdo $<$ e branco $B$. Em uma variante determinística, $\delta:Q\times\Gamma\to Q\times\Gamma\times\{E,D\}$ descreve novo estado, símbolo escrito e direção. Transições podem ser parciais; parar pode significar aceitar ou rejeitar, conforme a convenção adotada.

```mermaid
flowchart LR
  Q["Estado q"] --> H["Cabeçote lê símbolo"]
  H --> W["δ escolhe estado, escrita e movimento"]
  W --> T["Fita: ... | a | b | B | ..."]
  T --> Q
```

Por exemplo, ao ler `a`, a máquina pode escrever `X`, avançar à direita e mudar de $q_0$ para $q_1$. Ela pode também rejeitar ou seguir indefinidamente. Múltiplas fitas, trilhas, cabeçotes ou fita bilateral preservam a **classe de funções computáveis**; podem alterar a eficiência da simulação.

| Modelo | Memória adicional | Classe associada |
|---|---|---|
| Autômato finito | Só estado | Regular |
| Autômato de pilha | Pilha | LC |
| LBA | Fita linearmente limitada | SC |
| MT irrestrita | Fita sem limite pré-fixado | RE |

A **tese de Church–Turing** afirma que procedimentos efetivos são modeláveis por MT; é uma tese sobre uma noção informal, não um teorema provado a partir de uma definição formal de “algoritmo efetivo”. Cálculo lambda e MT formalizam a mesma noção de computabilidade.

## 7. Reconhecer é diferente de decidir

Uma linguagem **recursiva** tem um decisor: aceita e para nas entradas positivas; rejeita e para nas negativas. Uma linguagem **RE** tem um reconhecedor: aceita e para nas positivas; nas negativas pode rejeitar **ou não terminar**. Se nenhum reconhecedor existe, a linguagem está fora de RE.

| Entrada | Decisor de $L$ | Reconhecedor de $L$ |
|---|---|---|
| $w\in L$ | Para e aceita | Para e aceita |
| $w\notin L$ | Para e rejeita | Pode rejeitar ou executar para sempre |

$$L\text{ é recursiva}\iff L\text{ e }\overline L\text{ são RE}.$$

**Por quê?** Se ambos têm reconhecedores, rode as duas simulações alternadamente: uma acabará aceitando e dará a resposta correta. Rodar primeiro uma máquina até o fim seria um erro, pois ela poderia nunca parar.

Gramáticas tipo 0 têm produções irrestritas $\alpha\to\beta$ cujo lado esquerdo contém ao menos um não terminal. Elas geram exatamente as linguagens RE.

```mermaid
flowchart LR
  A["Decisor"] --> B["Sempre termina"]
  B --> C["Recursiva"]
  D["Reconhecedor"] --> E["Aceita membros; pode ciclar fora"]
  E --> F["RE"]
  G["Sem reconhecedor"] --> H["Fora de RE"]
```

> **Memorize:** “RE” não significa “decidível”. Pergunte sempre o que acontece quando a resposta correta é **não**.

## 8. Problema da parada e problemas de decisão

Computabilidade pergunta **se** há um procedimento efetivo; complexidade pergunta **quantos recursos** ele usa. Um problema de decisão é decidível se um algoritmo sempre termina com `sim` ou `não` corretos.

$$HALT_{TM}=\{\langle M,w\rangle\mid M\text{ para ao executar com }w\}.$$

`HALT` é RE: basta simular $M(w)$ e aceitar se houver parada. Não é decidível. A ideia da prova por contradição é supor um decisor `H(M,w)` e criar um programa `D(x)` que, consultando `H(x,x)`, faz o oposto: entra em ciclo quando `H` prevê parada e para quando prevê ciclo. Executar `D(D)` contradiz a previsão em ambos os casos. **Esperar indefinidamente** não fornece uma resposta `não`.

| Problema e representação da entrada | Situação |
|---|---|
| Pertinência $w\in L(A)$, com AFD $A$ dado | Decidível: simule o AFD |
| Vazio ou equivalência, com AFD(s) dados | Decidível por construções finitas |
| Pertinência $w\in L(G)$, com GLC $G$ dada | Decidível por algoritmo de parsing |
| Parada de MT arbitrária $M$ com entrada $w$ | RE, indecidível |
| Aceitação por MT arbitrária $M$ de $w$ | RE, indecidível |
| Equivalência de linguagens de duas MT arbitrárias | Indecidível |
| Ambiguidade de uma GLC arbitrária | Indecidível |

**Atenção:** a classe de linguagem e a **representação recebida** fazem parte do problema. “Equivalência” de AFD não tem a mesma resposta que “equivalência” de MT.

## 9. Cardinalidade e diagonalização

Um conjunto é enumerável se é finito ou pode ser colocado em bijeção com $\mathbb N$. Vale $|\mathbb N|=|\mathbb Z|=|\mathbb Q|=\aleph_0$. O teorema de Cantor afirma $\lvert\mathcal P(A)\rvert>\lvert A\rvert$.

Para $\Sigma$ finito não vazio, $\Sigma^*$ é enumerável: ordene cadeias por comprimento e, dentro de cada comprimento, lexicograficamente. Descrições finitas de máquinas também são enumeráveis. Porém $\mathcal P(\Sigma^*)$, o conjunto de **todas** as linguagens, não é enumerável. Logo, a maioria das linguagens não tem descrição finita nem reconhecedor.

**Diagonalização visual.** Considere uma suposta lista de todas as linguagens e uma lista de todas as cadeias. Cada célula registra pertinência. Construa $D$ escolhendo, para a cadeia $w_i$, o oposto da célula diagonal da linguagem $L_i$. Então $D$ difere de cada $L_i$ ao menos em $w_i$.

| Linguagem / cadeia | $w_1$ | $w_2$ | $w_3$ | … |
|---|---|---|---|---|
| $L_1$ | **1** | 0 | 1 | … |
| $L_2$ | 1 | **0** | 0 | … |
| $L_3$ | 0 | 1 | **1** | … |
| $D$ | **0** | **1** | **0** | … |

> **Conexão:** diagonalização mostra a existência de linguagens não RE; a prova da parada usa uma construção autorreferente relacionada, mas trata de um problema específico.

---

# TEOR · Funções, paradigmas e complexidade

**Em um minuto:** cálculo lambda descreve computação por aplicação e substituição; complexidade mede o custo dos procedimentos que existem. Em reduções, a direção indica qual problema conhecido é transformado no problema que se quer classificar.

## 10. Cálculo lambda

O cálculo lambda constrói computações só com **variáveis**, **abstração** ($\lambda x.M$) e **aplicação** ($MN$). Em $\lambda x.x$, `x` está ligada; em $\lambda x.y$, `y` está livre. Aplicação associa à esquerda: $MNP=(MN)P$.

| Regra | Significado | Exemplo |
|---|---|---|
| Alfa-conversão | Renomear variável ligada sem captura | $\lambda x.x\equiv_\alpha\lambda y.y$ |
| Beta-redução | Aplicar função por substituição sem captura | $(\lambda x.M)N\to_\beta M[x:=N]$ |
| Eta-redução | Eliminar parâmetro meramente repassado | $\lambda x.f\,x\to_\eta f$, se $x$ não é livre em $f$ |

**Exemplo guiado.** $(\lambda x.x+1)\,2\to_\beta 2+1\to3$. Para evitar captura em $(\lambda x.\lambda y.x)\,y$, renomeie antes o `y` ligado: $(\lambda x.\lambda z.x)\,y\to\lambda z.y$.

```mermaid
flowchart LR
  A["Expressão: (λx.M) N"] --> B["Renomear ligadas se houver risco de captura"]
  B --> C["Substituir ocorrências livres de x em M por N"]
  C --> D["Repetir até a forma desejada, quando existir"]
```

**Currying** transforma dois argumentos em duas aplicações: $\lambda x.\lambda y.x+y$. **Aplicação parcial** fixa só o primeiro argumento e devolve outra função. **Função de ordem superior** recebe ou devolve função. **Closure** combina função com o ambiente léxico que preserva suas variáveis livres. Recursão requer um mecanismo de autorreferência, como um combinador de ponto fixo.

**Numerais de Church:** $0=\lambda f.\lambda x.x$, $1=\lambda f.\lambda x.fx$, $2=\lambda f.\lambda x.f(fx)$, $3=\lambda f.\lambda x.f(f(fx))$. O numeral $n$ aplica $f$ exatamente $n$ vezes.

$$SUCC=\lambda n.\lambda f.\lambda x.f(nfx)$$
$$PLUS=\lambda m.\lambda n.\lambda f.\lambda x.mf(nfx)$$
$$MULT=\lambda m.\lambda n.\lambda f.m(nf).$$

Booleanos podem ser codificados por seleção: $TRUE=\lambda x.\lambda y.x$, $FALSE=\lambda x.\lambda y.y$, $IF=\lambda b.\lambda t.\lambda e.bte$. Confirme a associação das aplicações antes de reduzir. A ordem de avaliação pode afetar **terminação** de uma estratégia, mesmo quando uma forma normal existe.

> **Erro comum:** trocar nomes de variáveis ligadas sem verificar captura de variáveis livres.

## 11. Complexidade: custo depois da possibilidade

Fixe o tamanho $n$ da entrada, o modelo de computação e o recurso medido. **Tempo** conta passos; **espaço** conta células de memória usadas. $f(n)=O(g(n))$ quando existem constantes positivas $c,n_0$ tais que $f(n)\leq c\,g(n)$ para todo $n\geq n_0$. Big-O é **limite superior assintótico**; sozinho não dá custo exato, limite inferior ou tempo observado numa máquina específica.

```mermaid
flowchart LR
  A["Tamanho n"] --> B["O(1)"]
  A --> C["O(log n)"]
  A --> D["O(n)"]
  A --> E["O(n log n)"]
  A --> F["O(n²), O(n³)"]
  A --> G["O(2ⁿ), O(n!)"]
```

| Crescimento | Intuição para $n$ maior | Exemplo conceitual |
|---|---|---|
| $O(1)$ | Independe de $n$ | Acesso a posição conhecida |
| $O(\log n)$ | Reduz o espaço de busca por fator constante | Busca binária em dados ordenados |
| $O(n)$ | Percorre uma vez | Varredura |
| $O(n\log n)$ | Divisão e combinação | Ordenação eficiente |
| $O(n^k)$ | Polinomial para $k$ constante | Laços aninhados em quantidade fixa |
| $O(2^n)$ | Dobra ao aumentar $n$ em uma unidade | Exploração de subconjuntos |
| $O(n!)$ | Permutações | Busca ingênua de ordenações |

Polinomial e exponencial se separam pelo crescimento assintótico, não por um limiar numérico universal. Constantes e tamanhos pequenos ainda importam na prática.

## 12. P, NP e reduções

$P$ contém problemas de **decisão** resolvidos por MT determinística em tempo polinomial. $NP$ contém os resolvidos por MT não determinística em tempo polinomial; de modo equivalente, instâncias `sim` possuem certificados verificáveis em tempo polinomial.

$$P=\bigcup_{k\geq1}DTIME(n^k),\qquad NP=\bigcup_{k\geq1}NTIME(n^k),\qquad P\subseteq NP.$$

Não se sabe se $P=NP$. Para $A\leq_p B$, existe uma transformação computável em tempo polinomial $f$ tal que $w\in A\iff f(w)\in B$. **Direção para provar dificuldade de $B$:** transforme um problema já difícil $A$ em $B$, nunca o contrário.

```mermaid
flowchart LR
  A["Instância x de A"] -->|"f em tempo polinomial"| B["Instância f(x) de B"]
  B --> C["Solucionador de B"]
  C --> D["Resposta para A, pois x ∈ A ⇔ f(x) ∈ B"]
```

$B$ é **NP-hard** se todo problema de NP se reduz polinomialmente a $B$; não precisa estar em NP nem ser um problema de decisão. É **NP-completo** se, além disso, $B\in NP$. SAT é NP-completo pelo teorema de Cook–Levin. Se SAT estiver em P, então $P=NP$. Exemplos relevantes: SAT, 3SAT, ciclo hamiltoniano, conjunto independente, cobertura por vértices e TSP **na forma de decisão**.

| Classe | Solução rápida conhecida? | Certificado `sim` verificável? | Dificuldade |
|---|---|---|---|
| P | Sim | Sim | Pode ser fácil |
| NP | Em aberto para alguns problemas | Sim | Pode conter problemas difíceis |
| NP-hard | Não exigida | Não exigido | Pelo menos a dos problemas de NP |
| NP-completo | Se algum estiver em P, $P=NP$ | Sim | NP-hard e em NP |

> **Mini revisão:** para mostrar NP-completude, prove pertinência a NP e apresente uma redução **de um problema NP-completo conhecido para o alvo**.

## 13. Espaço e classes vizinhas

$PSPACE$ é a classe decidível em espaço polinomial determinístico; $NPSPACE$ usa não determinismo. O teorema de Savitch, sob condições habituais para $s(n)$, estabelece $NSPACE(s(n))\subseteq DSPACE(s(n)^2)$ e, portanto, $PSPACE=NPSPACE$.

$$P\subseteq NP\subseteq PSPACE\subseteq EXPTIME.$$

As igualdades adjacentes nessa cadeia permanecem questões abertas; sabe-se que $P\subsetneq EXPTIME$. **co-NP** troca as respostas `sim` e `não` dos problemas de NP. **L** e **NL** medem espaço logarítmico determinístico e não determinístico. **RP**, **co-RP** e **ZPP** introduzem aleatoriedade com diferentes garantias de erro e tempo esperado. Para esta revisão, priorize as definições de P, NP, PSPACE e a direção das inclusões.

## 14. Paradigmas e sistemas de tipos

Paradigma é uma forma de organizar a descrição e a execução de programas; linguagens reais frequentemente combinam várias.

| Paradigma | Ideia central | Construções frequentes |
|---|---|---|
| Imperativo | Comandos alteram estado | Atribuição, laços, condicionais |
| Procedural | Organiza comandos em procedimentos | Funções, parâmetros, chamadas |
| Orientado a objetos | Agrupa estado e comportamento | Objetos, encapsulamento, herança, polimorfismo |
| Declarativo | Descreve resultado, regras ou relações | Consultas, especificações |
| Funcional | Compõe transformações por funções | Imutabilidade, ordem superior, currying |
| Lógico | Usa fatos, regras e inferência | Prolog |

```mermaid
flowchart LR
  I["Imperativo: estado s"] --> J["Comando altera s"]
  J --> K["Novo estado s'"]
  F["Funcional: valor x"] --> G["Função f(x)"]
  G --> H["Novo valor y"]
```

**Tipagem estática** verifica informações e compatibilidade antes da execução segundo o modelo da linguagem; **dinâmica** trata tipos durante a execução. “Forte” e “fraca” são termos menos padronizados: descreva as coerções e operações permitidas pela linguagem, sem presumir que correspondem a estática e dinâmica.

Tipos primitivos incluem inteiros, booleanos, strings e reais; compostos incluem arrays, registros e tuplas; funções têm tipos de entrada e retorno. **Casting** é conversão explícita; **coerção**, conversão implícita; **inferência**, dedução do tipo pelo contexto; **polimorfismo**, uso uniforme com mais de um tipo; **tipo recursivo**, definição que se referencia; **imutabilidade**, impedimento de alterar um valor/ligação conforme a linguagem. Esses conceitos são independentes em vários eixos.

---

# COMP · Do código-fonte ao executável

**Em um minuto:** o lexer identifica tokens, o parser organiza a AST, a análise semântica valida significado e o gerador emite código. Para explicar um erro, localize a primeira fase capaz de detectá-lo.

## 15. Visão geral e evolução do projeto

Um compilador traduz código-fonte para uma representação alvo. As fases podem ser integradas ou separadas fisicamente, mas cada uma resolve uma pergunta diferente.

```mermaid
flowchart LR
  A["Código-fonte"] --> B["Pré-processamento"]
  B --> C["Lexer"]
  C --> D["Tokens"]
  D --> E["Parser"]
  E --> F["AST"]
  F --> G["Análise semântica"]
  G --> H["Assembly"]
  H --> I["Assembler"]
  I --> J["Linker"]
  J --> K["Executável"]
```

| Roteiro | Evolução | Conceitos a reconhecer |
|---|---|---|
| 1 · v0.0 | Calculadora | Inteiros, soma, subtração, validação |
| 2 · v1.0 | Análise inicial | `Token`, `Lexer`, `Parser`, `selectNext()`, `parseExpression()`, EOF |
| 3 · v1.1 | Expressões | Multiplicação, divisão inteira, unários, parênteses, precedência, `parseTerm()`, `parseFactor()` |
| 4 · v1.2 | AST e avaliação | `Node`, `IntVal`, `UnOp`, `BinOp`, `evaluate()` |
| 5 · v2.0 | Estado | Pré-processador, comentários, variáveis, `Identifier`, `SymbolTable`, `Assignment`, `Print`, `Block`, `NoOp` |
| 6 · v2.1 | Controle | AND/OR/NOT, relações, condicionais, laços, leitura, blocos |
| 7 · v2.2 | Tipos | `i32`, `str`, `bool`, `VarDec`, `StringVal`, `BoolVal`, checagem semântica |
| 8 · v3.0 | Assembly | `generate()`, `Code`, registradores, pilha, rótulos, variáveis locais |
| 9 · v2.3 | Funções | Parâmetros, retorno, escopo, tabelas encadeadas, `FuncDec`, `FuncCall`, `Return`, recursão |

**Atenção à cronologia:** os nomes das versões no roteiro 8 e 9 aparecem como `v3.0` e `v2.3`; preserve essa identificação do material, sem inferir uma ordem semântica pelo número.

## 16. Lexer e parser

O **lexer** transforma caracteres em tokens com tipo e valor. Para `total = 10 + 2;`, uma tokenização conceitual é `IDEN(total)`, `ASSIGN(=)`, `INT(10)`, `PLUS(+)`, `INT(2)`, `END(;)`, `EOF`. Ele reconhece números, identificadores e palavras reservadas, ignora espaços permitidos e rejeita símbolos inválidos. Operadores compostos pedem cuidado: leia `>=` como uma unidade, não como `>` e `=` separados, quando a linguagem assim determina.

O **parser** verifica a sequência de tokens segundo a gramática e constrói a estrutura. Um fragmento EBNF mostra a precedência:

```ebnf
EXPRESSION = TERM, { ("+" | "-"), TERM } ;
TERM = FACTOR, { ("*" | "/"), FACTOR } ;
FACTOR = ("+" | "-"), FACTOR
       | "(", EXPRESSION, ")"
       | NUMBER ;
```

`parseExpression()` chama `parseTerm()`, que chama `parseFactor()`: assim `*` e `/` são agrupados antes de `+` e `-`. A repetição em EBNF orienta a associatividade implementada pelo laço do parser. O parser de descida recursiva deve consumir toda a entrada e conferir `EOF`; aceitar apenas um prefixo é um erro.

```mermaid
flowchart LR
  A["Texto"] --> B["Lexer: caracteres → tokens"]
  B --> C["Parser: tokens → estrutura"]
  C --> D["AST"]
  B -.-> E["Erro léxico: símbolo inválido"]
  C -.-> F["Erro sintático: ordem inválida"]
```

## 17. AST: estrutura sem ruído sintático

A árvore sintática abstrata mantém o significado estrutural essencial. Para `2 + 3 * 4`, a multiplicação é filha da soma, refletindo a precedência:

```mermaid
flowchart TB
  A["BinOp +"] --> B["IntVal 2"]
  A --> C["BinOp *"]
  C --> D["IntVal 3"]
  C --> E["IntVal 4"]
```

Parênteses influenciam a árvore construída, mas não precisam de nó próprio. Em `evaluate()`, um nó de expressão avalia filhos necessários, aplica sua operação e devolve valor; nós de instrução podem alterar estado ou fluxo sem devolver valor da mesma forma. `generate()` substitui a avaliação direta por emissão de código nas versões posteriores.

| Família de nós | Exemplos | Responsabilidade |
|---|---|---|
| Valores e referências | `IntVal`, `BoolVal`, `StringVal`, `Identifier` | Produzir ou localizar valor |
| Operações | `UnOp`, `BinOp` | Aplicar operador e precedência já codificada na árvore |
| Estado e entrada/saída | `Assignment`, `VarDec`, `Print`, `Read` | Interagir com ambiente |
| Controle | `Block`, `If`, `While`, `NoOp` | Sequenciar ou desviar execução |
| Funções | `FuncDec`, `FuncCall`, `Return` | Definir, invocar e retornar |

## 18. Semântica, tipos e tabela de símbolos

Sintaxe válida não implica programa válido: `x + true` pode ser bem formado e semanticamente incompatível. A análise semântica confere declaração prévia, tipos, operadores, aridade e tipos de argumentos, retorno e validade de atribuições.

A `SymbolTable` associa nomes a atributos como tipo, valor, função e deslocamento de pilha. Uma tabela local pode apontar para `parent`; a busca começa localmente e sobe até encontrar a declaração. Se não encontrar, relata identificador inexistente.

```mermaid
flowchart TB
  B["Escopo do bloco: x local"] -->|"parent"| F["Escopo da função: parâmetros"]
  F -->|"parent"| G["Escopo global: funções e globais"]
```

**Shadowing** ocorre quando um nome local oculta um homônimo externo. **Visibilidade** é onde o nome pode ser encontrado; **vida útil** é por quanto tempo o valor/armazenamento existe. Elas não são a mesma coisa. Em chamada recursiva, cada invocação precisa de seu próprio ambiente, ainda que o código da função seja o mesmo.

## 19. Funções e pilha de chamadas

`FuncDec` define nome, parâmetros formais, tipos, retorno e corpo. `FuncCall` resolve a função, confere assinatura, liga argumentos aos parâmetros, cria ambiente local, executa o corpo e obtém o resultado. `Return` transfere valor e controle ao chamador.

```mermaid
flowchart LR
  A["main chama f(3)"] --> B["Criar quadro de f com parâmetro x=3"]
  B --> C["Executar corpo; pode chamar f novamente"]
  C --> D["Return devolve valor ao chamador"]
  D --> E["Desfazer quadro da chamada"]
```

**Pilha conceitual:** `main → f(3) → f(2) → f(1)` cria quatro quadros distintos; os retornos ocorrem na ordem inversa. Uma variável local de `f(2)` não é a mesma célula de `f(1)`.

## 20. Geração de Assembly NASM x86 de 32 bits

O método `generate()` de cada nó emite instruções correspondentes à sua ação. A classe `Code` reúne saída com `append()` e a produz com `dump()`. Uma implementação didática usa registradores e pilha para valores temporários e variáveis locais.

| Elemento | Papel conceitual |
|---|---|
| `EAX` | Resultado de expressões e retornos, conforme convenção do projeto |
| `ECX` | Apoio temporário |
| `EBP` | Base do quadro de pilha |
| `ESP` | Topo da pilha |
| `[EBP-4]`, `[EBP-8]` | Endereços relativos de locais de 4 bytes |

| Instrução | Ideia |
|---|---|
| `mov`, `push`, `pop` | Mover valores ou usar a pilha |
| `add`, `sub`, `imul` | Aritmética |
| `cmp`, `je`, `jmp` | Comparar e desviar por rótulos |
| `call` | Invocar função |

```mermaid
flowchart TB
  A["AST de If/While"] --> B["Gerar comparação"]
  B --> C["Desvio condicional para rótulo"]
  C --> D["Gerar bloco apropriado"]
  D --> E["Desvio ou continuação"]
```

O **assembler** converte Assembly em código objeto; o **linker** resolve ligações para formar o executável. O roteiro informado não implementa geração de código para strings nem otimização geral: ao explicar o projeto, diferencie a arquitetura possível daquilo que foi de fato desenvolvido.

---

# Revisão de véspera

**Uso rápido:** revise a folha de relações, responda às cinco questões sem olhar, confira o gabarito e volte aos trechos em que errou. O checklist final indica o que retomar primeiro.

## 21. Folha de fórmulas e teoremas

| Tema | Relação para saber explicar |
|---|---|
| Linguagem | $L\subseteq\Sigma^*$; $\Sigma^+=\Sigma^*\setminus\{\varepsilon\}$ |
| Chomsky | $Reg\subsetneq LC\subsetneq SC\subsetneq Rec\subsetneq RE$ |
| Bombeamento regular | $w=xyz$; $\lvert y\rvert>0$; $\lvert xy\rvert\le p$; $xy^iz\in L$ |
| Bombeamento LC | $z=uvwxy$; $\lvert vx\rvert>0$; $\lvert vwx\rvert\le p$; $uv^iwx^iy\in L$ |
| Decidibilidade | $L$ recursiva $\iff L$ e $\overline L$ RE |
| Cantor | $\lvert\mathcal P(A)\rvert>\lvert A\rvert$ |
| Beta | $(\lambda x.M)N\to_\beta M[x:=N]$, sem captura |
| Big-O | $f(n)\le c\,g(n)$ para $n\ge n_0$ |
| Redução | $A\le_p B\iff w\in A\Leftrightarrow f(w)\in B$ para $f$ polinomial |
| Savitch | $NSPACE(s(n))\subseteq DSPACE(s(n)^2)$; $PSPACE=NPSPACE$ |

## 22. Seis perguntas para reconstruir a disciplina

1. **Como uma linguagem é descrita e reconhecida?** A gramática gera cadeias; AF, AP, LBA e MT reconhecem classes com memórias diferentes. [Revisar Chomsky](#note-heading-2-hierarquia-de-chomsky).
2. **O que separa Rec de RE?** A parada em todas as entradas: o reconhecedor pode continuar para sempre em casos negativos. [Revisar decidibilidade](#note-heading-7-reconhecer-e-diferente-de-decidir).
3. **Por que existem linguagens fora de RE?** Descrições de máquinas são enumeráveis; conjuntos de cadeias formam uma família não enumerável. [Revisar diagonalização](#note-heading-9-cardinalidade-e-diagonalizacao).
4. **Como aplicar uma função lambda sem captura?** Identifique variáveis livres, faça alfa-conversão se necessário e só então beta-redução. [Revisar cálculo lambda](#note-heading-10-calculo-lambda).
5. **Como demonstrar dificuldade computacional?** Defina o custo, verifique certificados e reduza um problema conhecido ao problema alvo. [Revisar P e NP](#note-heading-12-p-np-e-reducoes).
6. **Como o compilador transforma o programa?** Fonte → tokens → AST → verificações semânticas → Assembly. [Revisar o pipeline](#note-heading-15-visao-geral-e-evolucao-do-projeto).

## 23. Como construir uma resposta rigorosa

1. **Classificação de linguagem:** formalize o conjunto, indique uma gramática ou reconhecedor para o limite superior e, se preciso, prove que a classe inferior não basta. No bombeamento, respeite os quantificadores.
2. **Decidibilidade:** escreva qual é a entrada codificada, qual resposta se pede e se o algoritmo sempre para. Separe reconhecedor de decisor. Em uma redução, confira a direção e a equivalência `sim ⇔ sim`.
3. **Complexidade:** defina tamanho da entrada e modelo, conte ou limite passos/células, indique se a afirmação é superior, inferior ou exata e só então use Big-O.
4. **Compilador:** percorra fonte → tokens → árvore → verificações semânticas → código. Para cada erro, identifique a fase que o detecta.
5. **Questão conceitual:** comece por intuição, dê definição formal, exemplo e uma propriedade ou conexão. Não substitua justificativa por nome de teorema.

## 24. Exercícios inéditos com dicas graduais

**A.** Para $L=\{a^nb^n\mid n\geq0\}$, explique por que uma pilha ajuda e por que um número fixo de estados não resolve. *Dica 1:* imagine muitos `a` antes do primeiro `b`. *Dica 2:* compare memória finita e contagem não limitada.

**B.** Um programa responde `sim` quando encontra uma prova de pertinência, mas pode continuar indefinidamente quando ela não existe. O que ele estabelece sobre a linguagem? *Dica 1:* desenhe os casos `sim` e `não`. *Dica 2:* confira a exigência de parada de um decisor.

**C.** Para mostrar que um novo problema $B$ é NP-hard, qual deve ser a direção de uma redução a partir de um problema conhecido $A$? *Dica 1:* suponha um solucionador rápido de $B$. *Dica 2:* ele deveria resolver $A$ após a transformação.

**D.** Desenhe a AST de `(2 + 3) * 4` e compare com a de `2 + 3 * 4`. *Dica 1:* identifique a operação na raiz. *Dica 2:* parênteses alteram agrupamento, não exigem nó próprio.

**E.** Na expressão $(\lambda x.\lambda y.x)\,y$, por que a substituição direta é perigosa? *Dica 1:* veja quais variáveis estão livres antes da redução. *Dica 2:* renomeie a variável ligada interna.

## 25. Gabarito comentado

**A · Pilha e bombeamento.** A pilha guarda um marcador por `a` e remove um por `b`, permitindo comparar quantidades sem limite pré-fixado. Para justificar que nenhum AF resolve o problema, suponha $L$ regular e use seu comprimento de bombeamento $p$. Na cadeia $a^pb^p$, qualquer divisão $w=xyz$ com $|xy|\le p$ e $|y|>0$ tem $y=a^k$ para algum $k>0$. Com $i=0$, obtemos $a^{p-k}b^p\notin L$, contrariando o lema. **Cuidado:** é preciso considerar toda divisão permitida, não escolher uma divisão conveniente.

**B · Reconhecedor.** A descrição garante que a linguagem é **RE**: todas as entradas positivas levam a `sim` em tempo finito. Ela não garante que a linguagem seja decidível, pois uma entrada negativa pode nunca receber resposta. Para concluir que é Rec, faltaria um procedimento que também parasse e rejeitasse todas as entradas negativas.

**C · Direção da redução.** Mostre $A\le_p B$, com $A$ já conhecido como NP-hard. A transformação $f$ deve ser polinomial e preservar `sim ⇔ sim`: $x\in A\iff f(x)\in B$. Se houvesse um algoritmo rápido para $B$, compor $f$ com ele resolveria $A$ rapidamente. Para afirmar que $B$ é **NP-completo**, prove ainda que $B\in NP$. **Cuidado:** $B\le_p A$ não estabelece a dificuldade de $B$.

**D · Duas ASTs.** Em `(2 + 3) * 4`, a raiz é `*`, com `+` e `4` como filhos. Em `2 + 3 * 4`, a raiz é `+`, com `2` e `*` como filhos. A árvore muda porque parênteses alteram o agrupamento; a AST não precisa de um nó para cada parêntese.

```text
(2 + 3) * 4          2 + 3 * 4
      *                   +
     / \                 / \
    +   4               2   *
   / \                     / \
  2   3                   3   4
```

**E · Substituição sem captura.** O argumento `y` está livre. Substituí-lo diretamente em $\lambda y.x$ faria esse `y` ficar ligado pela abstração interna e mudaria o significado. Primeiro renomeie a variável ligada: $\lambda x.\lambda y.x\equiv_\alpha\lambda x.\lambda z.x$. Depois reduza: $(\lambda x.\lambda z.x)\,y\to_\beta\lambda z.y$. O `y` do resultado continua livre.

## 26. Checklist por prioridade

**Alta:** explicar MT; diferenciar Rec/RE; justificar a indecidibilidade da parada; fazer reduções beta sem captura; definir P e NP; orientar uma redução polinomial; reconstruir a cadeia completa do compilador.

**Média:** classificar SC; explicar diagonalização e cardinalidade; comparar paradigmas e eixos de tipagem; percorrer escopos, chamadas e geração de Assembly.

**Pré-requisitos:** alfabeto, cadeias, gramáticas, AF/AP, hierarquia, bombeamento, EBNF e árvores de derivação.

**Autoavaliação final:** consigo dar definição, exemplo, reconhecedor e limite de cada classe? Consigo dizer quando uma máquina pode não parar? Consigo distinguir computabilidade de custo? Consigo localizar um erro em lexer, parser ou semântica? Consigo ler uma AST e explicar o papel de `SymbolTable`, `Return`, `EBP` e rótulos?

## Glossário rápido

| Termo | Significado |
|---|---|
| Reconhecedor | Aceita membros; pode não parar fora da linguagem |
| Decisor | Sempre para e responde corretamente |
| Redução | Transforma instâncias preservando a resposta |
| Não terminal | Símbolo substituído por produções da gramática |
| Lookahead | Próximos tokens consultados para decidir o parsing |
| Closure | Função mais ambiente léxico capturado |
| Shadowing | Declaração local oculta nome de escopo externo |
| Quadro de pilha | Dados próprios de uma chamada de função |

**Fonte do escopo:** guia mestre fornecido pelo usuário para a avaliação final 2026/1. A formulação didática, os exemplos e os diagramas desta anotação foram organizados a partir desse guia; quando houver divergência com as notas de aula, prevalece a orientação da disciplina.$lingpar_revision$
  where id = '5d6d780d-02c6-4d60-935b-2f72f0528a71'
    and subject_id = '22222222-2222-4222-8222-222222222222';

  if not found then
    raise exception 'Lingpar study note was not found';
  end if;
end;
$update_note$;

commit;
