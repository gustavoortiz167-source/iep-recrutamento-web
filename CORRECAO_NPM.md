# 🔧 Correção do Erro do NPM (Fury)

## ❌ Problema Identificado

O seu npm está configurado globalmente para usar o repositório privado do Mercado Libre (Fury):
```
registry=https://npm.artifacts.furycloud.io/
```

Quando o Render tenta instalar as dependências, ele não tem acesso a esse repositório privado, causando o erro:
```
npm error network request to https://npm.artifacts.furycloud.io/... failed
npm error errno ETIMEDOUT
```

## ✅ Solução Implementada

Criamos um arquivo `.npmrc` no projeto que força o uso do **registry público do npm**, ignorando sua configuração global.

### Arquivo criado: `.npmrc`
```
registry=https://registry.npmjs.org/
always-auth=false
```

Este arquivo sobrescreve as configurações globais e garante que tanto localmente quanto no Render, o npm use o registry público.

## 🚀 Próximos Passos

### 1. Fazer Commit das Mudanças

```bash
cd /Users/fefnnascimen/Downloads/iep-recrutamento-web

# Adicionar o .npmrc ao Git
git add .npmrc .gitignore

# Verificar o que será commitado
git status

# Fazer commit
git commit -m "Fix: Adicionar .npmrc para usar registry público do npm (fix build no Render)"

# Enviar para o GitHub
git push origin main
```

### 2. O Render Vai Fazer Deploy Automático

Assim que você fizer o `git push`, o Render detectará a mudança e começará um novo deploy automaticamente.

Desta vez, o build vai funcionar porque o npm usará o registry público! ✅

### 3. Acompanhar o Deploy

1. Acesse o dashboard do Render
2. Vá no seu serviço `iep-recrutamento`
3. Clique em "Logs"
4. Aguarde o build concluir (3-5 minutos)
5. Você verá:
   ```
   ==> npm install
   added 238 packages in 5s
   ==> Starting server...
   ✅ Your service is live!
   ```

## ⚠️ Importante

### Sobre o `.npmrc` Global

Você tem uma configuração global em `~/.npmrc` que aponta para o Fury:
```
~/.npmrc  → usa Fury (Mercado Libre)
```

Isso é normal se você trabalha na Meli. Mas para projetos pessoais ou externos, você precisa sobrescrever isso.

### O `.npmrc` do Projeto

O arquivo `.npmrc` que criamos no projeto sobrescreve a configuração global:
```
projeto/.npmrc  → usa registry público (npm)
```

**Este arquivo DEVE ser commitado no Git** para que o Render funcione!

### É Seguro Commitar?

✅ **SIM!** O `.npmrc` que criamos só contém:
```
registry=https://registry.npmjs.org/
always-auth=false
```

Não há credenciais, tokens ou senhas. É 100% seguro subir no GitHub.

❌ **NÃO** commite arquivos `.npmrc` que contenham tokens de autenticação ou credenciais privadas!

## 🧪 Teste Local

Já testado e funcionando! ✅

```bash
npm install  # ✅ Funcionou (238 packages)
npm start    # ✅ Servidor iniciou
```

## 🐛 Se Ainda Assim Falhar

### Verificar se o `.npmrc` foi commitado:
```bash
git ls-files | grep .npmrc
# Deve aparecer: .npmrc
```

### Verificar conteúdo do arquivo:
```bash
cat .npmrc
# Deve mostrar: registry=https://registry.npmjs.org/
```

### No Render, verificar logs:
- Se ainda aparecer Fury nos logs, o arquivo não foi commitado
- Se aparecer `registry.npmjs.org`, está correto!

## 📊 Antes vs Depois

### ❌ Antes (com erro):
```
npm install
→ Tenta baixar de: https://npm.artifacts.furycloud.io/
→ ETIMEDOUT (sem acesso)
→ Build falha
```

### ✅ Depois (corrigido):
```
npm install
→ Usa .npmrc do projeto
→ Baixa de: https://registry.npmjs.org/
→ Build sucesso!
```

## 💡 Dica Pro

Se você trabalha com projetos do Meli e projetos pessoais, considere usar:

### Opção 1: .npmrc por projeto
Crie `.npmrc` em cada projeto com o registry apropriado

### Opção 2: Alias no terminal
```bash
# No seu ~/.zshrc ou ~/.bashrc
alias npm-meli="npm --registry=https://npm.artifacts.furycloud.io/"
alias npm-public="npm --registry=https://registry.npmjs.org/"
```

Uso:
```bash
npm-meli install    # Para projetos Meli
npm-public install  # Para projetos pessoais
```

## ✅ Resumo

1. ✅ Problema identificado (Fury registry)
2. ✅ Solução implementada (.npmrc)
3. ✅ Testado localmente (funciona)
4. ⏳ Aguardando: git push + deploy no Render

Execute os comandos da seção "Próximos Passos" e seu deploy vai funcionar! 🚀

---

**Desenvolvido para:** IEP São Lucas  
**Problema:** npm ETIMEDOUT (Fury)  
**Solução:** .npmrc com registry público  
**Data:** Novembro 2025

