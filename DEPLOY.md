# 🚀 Guia de Deploy - IEP Recrutamento Web

Este guia mostra como hospedar seu sistema na web gratuitamente ou em servidores pagos.

---

## 🎯 Opções de Hospedagem

### 1. **Railway** (Recomendado - Grátis)
✅ Gratuito para projetos pequenos  
✅ Fácil de configurar  
✅ Suporta SQLite  
✅ Deploy automático via Git  

### 2. **Render** (Alternativa Grátis)
✅ Plano gratuito disponível  
✅ SSL automático  
✅ Suporta banco de dados  

### 3. **Vercel** (Para frontend estático)
⚠️ Melhor para sites estáticos  
⚠️ Requer adaptações para SQLite  

### 4. **Servidor Próprio (VPS)**
💰 Pago mas completo  
✅ Controle total  
✅ Melhor para produção  

---

## 📦 OPÇÃO 1: Deploy no Railway (MAIS FÁCIL)

### Passo 1: Preparação

1. **Crie uma conta no Railway:**
   - Acesse: https://railway.app
   - Faça login com GitHub

### Passo 2: Criar Projeto

1. **No Railway, clique em "New Project"**
2. **Selecione "Deploy from GitHub repo"**
3. **Conecte seu repositório** (ou suba o código)

### Passo 3: Configurar Variáveis de Ambiente

No painel do Railway, vá em **"Variables"** e adicione:

```
ADMIN_PASSWORD=SuaSenhaSuperSegura123!
PORT=3000
```

⚠️ **IMPORTANTE:** Troque `SuaSenhaSuperSegura123!` por uma senha forte!

### Passo 4: Deploy

1. Railway detectará automaticamente que é um projeto Node.js
2. Clique em **"Deploy"**
3. Aguarde alguns minutos...
4. Seu site estará no ar! 🎉

### Passo 5: Acessar

Railway fornecerá uma URL tipo:
```
https://seu-app-production.up.railway.app
```

---

## 📦 OPÇÃO 2: Deploy no Render

### Passo 1: Criar Conta

1. Acesse: https://render.com
2. Faça cadastro/login

### Passo 2: Novo Web Service

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório Git ou faça upload

### Passo 3: Configurações

- **Name:** iep-recrutamento
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Passo 4: Variáveis de Ambiente

Adicione as variáveis:
```
ADMIN_PASSWORD=SuaSenhaSuperSegura123!
NODE_VERSION=18
```

### Passo 5: Deploy

Clique em **"Create Web Service"** e aguarde!

---

## 📦 OPÇÃO 3: Deploy em Servidor Próprio (VPS)

### Requisitos:
- VPS com Ubuntu/Debian
- Acesso SSH
- Domínio (opcional)

### Passo 1: Conectar ao Servidor

```bash
ssh usuario@seu-servidor.com
```

### Passo 2: Instalar Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Passo 3: Instalar PM2 (gerenciador de processos)

```bash
sudo npm install -g pm2
```

### Passo 4: Fazer Upload do Código

```bash
# No seu computador local:
cd /Users/fefnnascimen/Downloads/iep-recrutamento-web
rsync -avz --exclude 'node_modules' --exclude '.git' . usuario@seu-servidor.com:/home/usuario/iep-recrutamento-web/
```

### Passo 5: No Servidor

```bash
cd /home/usuario/iep-recrutamento-web
npm install
```

### Passo 6: Configurar Variáveis de Ambiente

```bash
nano .env
```

Adicione:
```
PORT=3000
ADMIN_PASSWORD=SuaSenhaSuperSegura123!
```

Salve com `Ctrl+X`, `Y`, `Enter`

### Passo 7: Iniciar com PM2

```bash
pm2 start server.js --name iep-recrutamento
pm2 save
pm2 startup
```

### Passo 8: Configurar Nginx (Proxy Reverso)

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/iep
```

Cole:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative:
```bash
sudo ln -s /etc/nginx/sites-available/iep /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 9: SSL (HTTPS) com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

---

## 🔐 IMPORTANTE: Segurança

### Senha de Administrador

A senha padrão no arquivo `.env` é: **`iep2025@seguro`**

⚠️ **TROQUE IMEDIATAMENTE antes do deploy!**

Use uma senha forte:
- Mínimo 12 caracteres
- Letras maiúsculas e minúsculas
- Números
- Caracteres especiais

Exemplo: `M3uS1st3m@IEP!2025#Segur0`

### Como Alterar a Senha

**Localmente:**
```bash
# Edite o arquivo .env
nano .env

# Mude a linha:
ADMIN_PASSWORD=SuaNovaSenhaForte123!
```

**No Railway/Render:**
1. Vá nas configurações do projeto
2. Encontre "Environment Variables"
3. Edite `ADMIN_PASSWORD`
4. Clique em "Redeploy"

---

## 🌐 Acessando o Sistema Hospedado

### De Qualquer Dispositivo (Leitura)
Qualquer pessoa com o link pode:
- ✅ Ver pacientes cadastrados
- ✅ Ver indicadores e gráficos
- ✅ Exportar relatórios

### Do Seu Dispositivo (Escrita)
Apenas quem tiver a senha pode:
- 🔒 Cadastrar novos pacientes
- 🔒 Editar pacientes existentes
- 🔒 Excluir pacientes
- 🔒 Fazer upload de documentos
- 🔒 Alterar logo

### Como Funciona:
1. Ao tentar fazer uma alteração, aparecerá um prompt: **"🔐 Digite a senha de administrador"**
2. Digite sua senha configurada no `.env`
3. A senha fica salva durante a sessão (enquanto não fechar o navegador)
4. Se errar a senha, precisará digitar novamente

---

## 📊 Verificar Status do Deploy

### Railway
- Acesse o dashboard: https://railway.app
- Veja logs em tempo real
- Status de deploy

### Render
- Acesse: https://dashboard.render.com
- Clique no seu serviço
- Veja logs e métricas

### Servidor Próprio
```bash
# Status do PM2
pm2 status

# Ver logs
pm2 logs iep-recrutamento

# Reiniciar
pm2 restart iep-recrutamento
```

---

## 🔧 Comandos Úteis

### Railway CLI
```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Ver logs
railway logs

# Redeploy
railway up
```

### Render
```bash
# Redeploy via Git
git add .
git commit -m "atualização"
git push origin main
# Render faz deploy automático
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'dotenv'"
```bash
npm install dotenv --save
```

### Erro: "Port already in use"
Mude a porta no `.env`:
```
PORT=3001
```

### Banco de dados não persiste
Em algumas plataformas gratuitas (Heroku, Vercel), o disco é temporário.
Soluções:
- Use Railway ou Render (suportam disco persistente)
- Migre para PostgreSQL/MySQL
- Use serviço de storage (AWS S3, Cloudinary)

### Uploads não funcionam
Verifique se a pasta `uploads/` existe:
```bash
mkdir -p uploads
```

---

## 📞 Suporte

**Problemas no deploy?**
1. Verifique os logs da plataforma
2. Confirme que as variáveis de ambiente estão corretas
3. Teste localmente antes: `npm start`

**Esqueceu a senha?**
1. Acesse as variáveis de ambiente na plataforma
2. Veja o valor de `ADMIN_PASSWORD`
3. Ou altere para uma nova senha

---

## ✅ Checklist de Deploy

- [ ] Código funcionando localmente (`npm start`)
- [ ] Senha alterada no `.env` (não use a senha padrão!)
- [ ] Plataforma de hospedagem escolhida
- [ ] Conta criada na plataforma
- [ ] Repositório Git criado (se usar Railway/Render)
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] URL funcionando
- [ ] Teste de leitura (sem senha)
- [ ] Teste de escrita (com senha)
- [ ] Backup do banco de dados configurado

---

## 🎉 Pronto!

Seu sistema IEP está agora acessível na web!

**URL do seu site:** (será fornecida pela plataforma)

**Senha de admin:** (a que você configurou no `.env`)

**Compartilhe o link** com quem precisa visualizar os dados.  
**Guarde a senha** apenas para você (admin).

---

**Desenvolvido para:** IEP São Lucas  
**Versão:** 8.0 Web Edition + Deploy  
**Data:** Novembro 2025

