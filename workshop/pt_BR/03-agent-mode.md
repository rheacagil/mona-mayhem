<!-- l10n-sync: source-file="workshop/03-agent-mode.md" -->
# Parte 3: Construa o jogo com fluxos de trabalho agênticos

---

Nesta parte, o Copilot passa do planejamento para a implementação. Em vez de escrever código linha por linha, você descreve o que precisa e deixa o Copilot trabalhar nos arquivos que precisam ser alterados.

## Tarefa 1: Conecte a batalha

<!-- track:vscode:start -->
1. Mude para **Agent** no Copilot Chat.
2. Digite este prompt:
<!-- track:vscode:end -->

<!-- track:cli:start -->
1. Volte o Copilot CLI ao fluxo normal de programação (ou continue no autopilot se quiser que ele prossiga até você pará-lo).
2. Se ajudar, mencione o arquivo da página para dar mais contexto: `@src/pages/index.astro`
3. Digite este prompt:
<!-- track:cli:end -->

   > Add client-side JavaScript to the battle page that:
   > 1. When the Battle button is clicked, gets both usernames from the inputs
   > 2. Validates both are filled (show error if not)
   > 3. Fetches both users' contribution data in parallel from our API
   > 4. Renders contribution graphs as colored grids — each day is a colored square using GitHub's color palette
   > 5. Shows a VS badge between the two users
   > 6. Displays username, total contributions, and date range for each user
   > 7. Handles loading states and errors
   > 8. Also triggers on Enter key in input fields.
   > 9. Simple UI for now that is already scaffolded.
   >
   > Use TypeScript interfaces for the contribution data structure.

<!-- track:vscode:start -->
3. Deixe o Agent Mode implementar as alterações em `index.astro`.
4. Revise as alterações propostas na visualização de diff antes de aceitá-las.
<!-- track:vscode:end -->

<!-- track:cli:start -->
4. Deixe o Copilot CLI implementar as alterações em `src/pages/index.astro`.
5. Use `/diff` para revisar as alterações geradas e depois aprove-as.
<!-- track:cli:end -->

## Tarefa 2: Teste a batalha

> **⚠️ Não está vendo as alterações?** Se a página de batalha não tiver sido atualizada, pare o servidor de desenvolvimento (`Ctrl+C`), reinicie com `npm run dev` e atualize o navegador.

1. Digite `octocat` e `torvalds` como nomes de usuário e clique em **Battle**.
2. Os dois gráficos de contribuições devem aparecer lado a lado, com grids coloridos.
3. Teste os casos de erro:
   - Deixe um ou ambos os campos vazios e clique em Battle: deve aparecer um erro de validação.
   - Digite um nome de usuário inválido: o app deve exibir um erro da API.
4. Pressione **Enter** em qualquer campo: a batalha deve ser iniciada como se você tivesse clicado no botão.

## Tarefa 3: Itere com o Copilot

Se algo não estiver como deveria, envie feedback diretamente ao Copilot. Por exemplo:

- *"The contribution squares are too large, make them 12x12px"*
- *"Add a hover tooltip showing the date and contribution count"*
- *"The loading state needs a pulse animation"*

<!-- track:vscode:start -->
O Agent Mode gerencia naturalmente alterações em vários arquivos e iterações. Cada prompt de acompanhamento aproveita a conversa anterior, então você pode aprimorar a implementação aos poucos sem recomeçar.
<!-- track:vscode:end -->

<!-- track:cli:start -->
As sessões do Copilot CLI mantêm o histórico, então cada prompt de acompanhamento se baseia nos anteriores. Use `/session` ou `/context` para consultar o contexto que o Copilot está mantendo; depois de uma iteração maior, use `/review` para procurar bugs ou melhorias.
<!-- track:cli:end -->

## Dicas para esta parte

- **Especifique o que você quer**: requisitos claros levam a resultados melhores.
- **Divida tarefas grandes em prompts menores** se o Copilot sair do rumo.
- **Revise as alterações antes de aceitá-las**: inspecionar o código gerado é mais rápido do que reescrevê-lo depois.
- **Teste o app após cada etapa de implementação** para localizar os problemas rapidamente.

## ✅ Parte 3 concluída

Você aprendeu a:

- Usar o Copilot para **implementar alterações em vários arquivos**
- **Iterar nos resultados** com feedback específico
- Fazer o **ciclo completo de uma funcionalidade**: implementação, revisão, testes e refinamento
