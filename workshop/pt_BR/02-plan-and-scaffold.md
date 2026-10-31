<!-- l10n-sync: source-file="workshop/02-plan-and-scaffold.md" -->
# Parte 2: Planejamento e estrutura inicial

---

Antes de escrever código, use os fluxos de planejamento do Copilot para pensar na arquitetura. Planejar primeiro ajuda a projetar sistemas melhores e dá ao Copilot o contexto necessário para gerar código de maior qualidade.

## Tarefa 1: Planeje a arquitetura da API

<!-- track:vscode:start -->
1. Mude para **Plan** no Copilot Chat (clique no seletor de modo na parte inferior do painel de chat).
<!-- track:vscode:end -->

<!-- track:cli:start -->
1. Ative o **modo de planejamento** no Copilot CLI pressionando **Shift+Tab** até o modo mudar ou usando `/plan`.
<!-- track:cli:end -->

2. Digite este prompt:

   ```
   I need to build a server-side API proxy that fetches GitHub contribution data
   for any username. The endpoint is https://github.com/{username}.contribs which
   returns JSON. We need to bypass CORS restrictions. Plan the implementation
   including the route structure, error handling, and caching strategy.
   ```

3. **Revise o plano**: é aqui que o planejamento se destaca. Não aceite a primeira resposta sem avaliar:
   - Peça esclarecimentos sobre o que não estiver claro.
   - Sugira mudanças se algo não parecer adequado.
   - Itere até ficar satisfeito com a abordagem.

<!-- track:vscode:start -->
4. Quando estiver satisfeito com o plano, peça ao Copilot para implementá-lo: mude para **Agent** e solicite que prossiga.
<!-- track:vscode:end -->

<!-- track:cli:start -->
4. Quando estiver satisfeito com o plano, peça ao Copilot CLI para prosseguir com a implementação.
5. Revise as alterações nos arquivos com `/diff` antes de aprová-las.
<!-- track:cli:end -->

6. **Resultado:** Agora você deve ter uma rota de API em:

   ```
   src/pages/api/contributions/[username].ts
   ```

## Tarefa 2: Teste a API

> **⚠️ Não está vendo as alterações?** Se o servidor de desenvolvimento não detectar a nova rota, pare-o (`Ctrl+C`) e reinicie com `npm run dev`.

1. Confirme que o servidor de desenvolvimento está rodando e teste o endpoint:

   ```bash
   curl http://localhost:4321/api/contributions/octocat
   ```

2. Você deve receber dados de contribuições em JSON.
3. Teste também o caso de erro: use um nome de usuário inválido e confirme que ele retorna uma resposta de erro adequada.

## Tarefa 3: Planeje a página de batalha

<!-- track:vscode:start -->
1. Continue no modo **Plan** e digite este prompt:
<!-- track:vscode:end -->

<!-- track:cli:start -->
1. Continue no modo de planejamento (ou execute `/plan`) e digite este prompt:
<!-- track:cli:end -->

   ```
   Now I need the main page. Plan a battle page for "Mona Mayhem - GitHub
   Contribution Battle Arena" with: two username inputs (Player 1 and Player 2),
   a battle button, and a results area. Keep the UI simple — don't over-engineer
   the layout or styling at this stage. Plan the HTML structure, basic styling,
   and how the battle interaction will work.
   ```

2. **Revise e itere** no plano: faça perguntas, sugira mudanças e refine a abordagem.

<!-- track:vscode:start -->
3. Quando estiver satisfeito, mude para **Agent** e deixe o Copilot criar a página.
<!-- track:vscode:end -->

<!-- track:cli:start -->
3. Quando estiver satisfeito, peça ao Copilot CLI para implementar o plano aprovado.
4. Use `/diff` novamente para inspecionar a estrutura de HTML e CSS antes de aprová-la.
<!-- track:cli:end -->

## Tarefa 4: Verifique a estrutura inicial

> **⚠️ Não está vendo as alterações?** Se a página não estiver com a aparência esperada ou não tiver sido atualizada, pare o servidor de desenvolvimento (`Ctrl+C`), reinicie com `npm run dev` e atualize o navegador.

1. Abra http://localhost:4321 no navegador.
2. Você deve ver:
   - O título do jogo
   - Dois campos de nome de usuário (Player 1 e Player 2)
   - Um botão de batalha
3. O botão ainda não vai funcionar, e isso é esperado. Ainda não conectamos a lógica de interação; isso vem a seguir.

---

## ✅ Parte 2 concluída!

Você aprendeu a:

- **Planejar antes de programar**, em vez de começar direto pela implementação
- **Iterar nos planos** até a arquitetura ficar adequada
- **Passar do plano à implementação** com um fluxo mais claro e seguro
