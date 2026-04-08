# Problemas Conhecidos e Soluções — GiantAnimator

---

## ❌ Problema: Arquivos no input não são detectados
**Sintoma:** Servidor rodando mas imagens colocadas em shared/input/ não são processadas.
**Causa:** Watcher único (só chokidar) falha no Windows em alguns cenários.
**Solução:** Usar 3 camadas: chokidar + fs.watch + polling setInterval 5s. Ver implementação em server/index.ts.

---

## ❌ Problema: Servidor não inicia (erro de compilação)
**Sintoma:** INICIAR.bat aguarda 60s e mostra erro no log.
**Causa:** ts-node sem --transpile-only faz type-checking completo e pode falhar.
**Solução:** Sempre usar `ts-node --transpile-only index.ts` no script de start.

---

## ❌ Problema: Porta 3000 já em uso ao reiniciar
**Sintoma:** Erro EADDRINUSE ao iniciar o servidor.
**Causa:** Processo anterior não foi encerrado corretamente.
**Solução:** INICIAR.bat mata o processo anterior na porta via netstat + taskkill antes de iniciar.

---

## ❌ Problema: node_modules ausente após git clone
**Sintoma:** Erro "Cannot find module" ao iniciar.
**Solução:** INICIAR.bat verifica se node_modules existe e roda `npm install` automaticamente.
