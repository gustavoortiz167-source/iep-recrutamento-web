# ⚡ Deploy Rápido - 5 Minutos

## 🚀 Opção Mais Fácil: Railway (Grátis)

### 1️⃣ Criar Conta
- Acesse: https://railway.app
- Faça login com GitHub

### 2️⃣ Subir Código

**Opção A: Via GitHub (Recomendado)**
```bash
cd /Users/fefnnascimen/Downloads/iep-recrutamento-web

# Inicializar Git (se ainda não tem)
git init
git add .
git commit -m "Deploy inicial"

# Criar repositório no GitHub e fazer push
# (siga as instruções do GitHub)
```

**Opção B: Via Railway CLI**
```bash
# Instalar CLI do Railway
npm install -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Deploy
railway up
```

### 3️⃣ Configurar Senha

No Railway:
1. Clique no seu projeto
2. Vá em "Variables"
3. Clique em "New Variable"
4. Adicione:
   - Nome: `ADMIN_PASSWORD`
   - Valor: `SuaSenhaSegura123!` ⚠️ (TROQUE!)

### 4️⃣ Pronto! 🎉

Railway vai gerar uma URL tipo:
```
https://iep-recrutamento-production.up.railway.app
```

Acesse e teste!

---

## 📱 Como Usar Depois do Deploy

### **Visualizar de Qualquer Lugar (Sem Senha)**
- Abra a URL no navegador
- Veja pacientes, indicadores, gráficos
- Exporte relatórios

### **Fazer Alterações (Com Senha)**
- Ao clicar em "Adicionar paciente", "Editar" ou "Excluir"
- Aparecerá: "🔐 Digite a senha de administrador"
- Digite a senha que você configurou
- Pronto! Pode fazer alterações

---

## 🔐 SEGURANÇA

### Senha Padrão Local
Se estiver testando localmente, a senha padrão é:
```
iep2025@seguro
```

### ⚠️ ANTES DO DEPLOY, MUDE A SENHA!
No arquivo `.env`:
```
ADMIN_PASSWORD=MinhaNovaS3nha!Forte@2025
```

Ou nas variáveis de ambiente da plataforma.

---

## 🐛 Problemas?

### Site não abre
- Aguarde 2-3 minutos após o deploy
- Veja os logs no painel do Railway
- Verifique se o deploy foi concluído

### "Senha necessária"
- Normal! Isso protege suas alterações
- Digite a senha configurada no passo 3

### Esqueci a senha
- Acesse o painel do Railway
- Vá em "Variables"
- Veja o valor de `ADMIN_PASSWORD`

---

## 📊 Próximos Passos

1. ✅ **Compartilhe a URL** com sua equipe
2. ✅ **Guarde a senha** em local seguro
3. ✅ **Faça backup** do banco periodicamente
4. ✅ **Configure domínio customizado** (opcional)

---

## 💡 Dica Pro

### Domínio Customizado
No Railway:
1. Vá em "Settings" → "Domains"
2. Clique em "Generate Domain"
3. Ou adicione seu próprio domínio

---

**Tem dúvidas?** Consulte o `DEPLOY.md` completo!

