# Error Log — GiantAnimator

Bugs críticos que já corrigimos. Atualizar aqui ao corrigir qualquer bug não trivial na mesma sessão.

**Formato:**
```
## ❌ [Título]
**Sintoma:** ...
**Causa raiz:** ...
**Fix:** ...
**Prevenção:** ...
```

---

## ❌ Electron/Node 20 — `createClient()` Supabase trava sem WebSocket polyfill

**Sintoma:** "Erro de conexão" no login; "⚠️ Sync desativado" nos logs do servidor.

**Causa raiz:** Node 20 no Electron não expõe `WebSocket` globalmente. `@supabase/supabase-js` v2 tenta usar `WebSocket` durante `createClient()` — sem ele, lança exceção que é silenciada pelo `catch`, deixando o cliente como `null`.

**Fix:** Criar função `ensureWebSocket()` que importa o pacote `ws` e atribui ao `globalThis.WebSocket` antes de qualquer `createClient()`. Chamar com `await` antes de `createClient()`.

**Prevenção:** Todo arquivo que chama `createClient()` (authService.ts, supabaseService.ts) DEVE chamar `ensureWebSocket()` primeiro. Ao criar novo serviço Supabase, copiar o padrão de `initSupabase()` do supabaseService.ts.

---

## ❌ App empacotado — copiar só alguns arquivos dist causa crash no startup

**Sintoma:** `SyntaxError: syncTrainingSample not exported` (ou similar) ao iniciar o app empacotado.

**Causa raiz:** Apenas `index.js` + `authService.js` foram copiados para `resources/app/server/dist/`; `supabaseService.js` e outros módulos importados ficaram de fora.

**Fix:** Copiar TODOS os `server/dist/*.js` com glob: `cp server/dist/*.js GiantAnimator-win-x64/resources/app/server/dist/`

**Prevenção:** Nunca enumerar arquivos dist manualmente. Sempre usar glob `*.js`. Checar também se `node_modules` do server está presente no pacote.

---

## ❌ Import dinâmico de `@supabase/supabase-js` em rota — falha no app empacotado

**Sintoma:** Erro TypeScript em compilação + crash em runtime em rota de upload ao tentar `import('@supabase/supabase-js')` dinamicamente com `.default`.

**Causa raiz:** Import dinâmico de pacotes CJS no contexto do app empacotado tem comportamento diferente do ambiente de dev. Além disso, redundante — já existe cliente singleton inicializado.

**Fix:** Criar função `tagJobUser(jobId, userId)` em `supabaseService.ts` que usa o cliente singleton já inicializado. Chamar essa função na rota ao invés do import dinâmico.

**Prevenção:** Nunca usar `import()` dinâmico para pacotes que têm um serviço singleton no projeto. Usar sempre o singleton já aquecido.

---

## ❌ `supabaseService.ts` — stats do admin sempre 0

**Sintoma:** Painel admin mostra 0 renders para todos os usuários mesmo após jobs completarem com sucesso.

**Causa raiz:** `getClient()` era síncrono e sem polyfill WebSocket → `createClient()` lançava silenciosamente → cliente ficava `null` → nenhum job era sincronizado ao Supabase → tabela `jobs` vazia → stats retornam 0. (authService funcionava porque tinha `ensureWebSocket()` — supabaseService não.)

**Fix:** (1) Adicionar `ensureWebSocket()` ao supabaseService. (2) Exportar `initSupabase()` que inicializa o cliente async. (3) Chamar `await initSupabase()` como primeira linha do bloco de startup em `server/index.ts`.

**Prevenção:** O startup do servidor DEVE inicializar o Supabase antes de qualquer outra operação. Se um novo serviço for adicionado, seguir o mesmo padrão de export + await no startup.
