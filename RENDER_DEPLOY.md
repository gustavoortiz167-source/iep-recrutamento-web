# 🚀 Deploy no Render - Guia Passo a Passo

## ✅ Vantagens do Render (Plano Gratuito)
- ✅ **Gratuito para sempre** (não expira em 30 dias como Railway)
- ✅ SSL automático (HTTPS)
- ✅ Deploy automático via Git
- ✅ 750 horas/mês grátis (suficiente para 1 aplicação 24/7)
- ✅ Suporta SQLite e banco de dados persistente

## ⚠️ Limitações do Plano Gratuito
- ⏱️ Serviço "dorme" após 15 minutos de inatividade (demora ~30s para "acordar")
- 💾 Disco persistente precisa de configuração extra
- 🐌 Performance mais limitada que planos pagos

---

## 📦 PASSO A PASSO COMPLETO

### **Passo 1: Preparar o Código no GitHub**

O Render precisa que seu código esteja no GitHub, GitLab ou Bitbucket.

#### 1.1 - Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `iep-recrutamento-web`
3. Deixe **privado** (dados sensíveis!)
4. **NÃO** marque "Initialize with README"
5. Clique em "Create repository"

#### 1.2 - Subir o Código

No seu terminal:

```bash
cd /Users/fefnnascimen/Downloads/iep-recrutamento-web

# Inicializar Git (se ainda não tiver)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Deploy inicial - Sistema IEP Recrutamento"

# Conectar ao GitHub (substitua SEU_USUARIO pelo seu usuário)
git remote add origin https://github.com/SEU_USUARIO/iep-recrutamento-web.git

# Subir para o GitHub
git branch -M main
git push -u origin main
```

> **Nota:** Se pedir usuário/senha, use seu username do GitHub e um **Personal Access Token** como senha.

---

### **Passo 2: Criar Conta no Render**

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Escolha **"Sign up with GitHub"** (mais fácil!)
4. Autorize o Render a acessar seus repositórios

---

### **Passo 3: Criar Novo Web Service**

1. No dashboard do Render, clique em **"New +"** (canto superior direito)
2. Selecione **"Web Service"**
3. Conecte seu repositório:
   - Se aparecer a lista, selecione `iep-recrutamento-web`
   - Se não aparecer, clique em "Configure account" e autorize o acesso
4. Clique em **"Connect"**

---

### **Passo 4: Configurar o Web Service**

Preencha os campos:

#### **Name** (Nome do serviço)
```
iep-recrutamento
```
> Este será parte da URL: `iep-recrutamento.onrender.com`

#### **Region** (Região)
```
Frankfurt (Europe West) ou Oregon (US West)
```
> Escolha o mais próximo do Brasil

#### **Branch** (Branch do Git)
```
main
```

#### **Root Directory** (Diretório raiz)
```
(deixe vazio)
```

#### **Runtime** (Ambiente)
```
Node
```

#### **Build Command** (Comando de build)
```
npm install
```

#### **Start Command** (Comando para iniciar)
```
npm start
```

#### **Instance Type** (Tipo de instância)
```
Free
```
> ✅ Selecione o plano GRATUITO!

---

### **Passo 5: Configurar Variáveis de Ambiente**

**ANTES** de clicar em "Create Web Service", role para baixo até **"Environment Variables"**.

Clique em **"Add Environment Variable"** e adicione:

#### Variável 1: Senha de Admin
```
Key:   ADMIN_PASSWORD
Value: SuaSenhaForteAqui123!
```
⚠️ **IMPORTANTE:** Use uma senha forte e guarde em local seguro!

#### Variável 2: Porta (Render define automaticamente, mas boa prática ter)
```
Key:   PORT
Value: 10000
```

#### Variável 3: Node Version (opcional mas recomendado)
```
Key:   NODE_VERSION
Value: 18
```

Resultado final deve ter 3 variáveis:
```
ADMIN_PASSWORD = SuaSenhaForteAqui123!
PORT = 10000
NODE_VERSION = 18
```

---

### **Passo 6: Configurar Disco Persistente (IMPORTANTE!)**

Por padrão, o Render usa disco temporário. Para persistir o banco SQLite:

1. Role até **"Disk"**
2. Clique em **"Add Disk"**
3. Configure:
   ```
   Name: data
   Mount Path: /app/data
   Size: 1 GB (máximo no plano free)
   ```
4. Clique em **"Save"**

> **Nota:** Sem isso, seus dados serão perdidos a cada deploy!

---

### **Passo 7: Criar o Serviço**

1. Revise todas as configurações
2. Clique em **"Create Web Service"** (botão azul no final da página)
3. Aguarde o deploy (5-10 minutos)

Você verá os logs em tempo real:
```
==> Building...
==> npm install
==> Starting...
==> Your service is live! 🎉
```

---

### **Passo 8: Ajustar o Caminho do Banco de Dados**

Como configuramos um disco persistente em `/app/data`, precisamos ajustar o código:

#### 8.1 - Editar `database.js`

No seu computador, edite o arquivo:

```javascript
// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Para produção (Render), usar disco persistente
// Para desenvolvimento, usar pasta local
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const dataDir = isProduction ? '/app/data' : __dirname;

// Criar diretório se não existir
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'iep_recrutamento.db');

console.log(`📦 Usando banco de dados em: ${DB_PATH}`);

// Resto do código permanece igual...
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// ... resto do arquivo igual
```

#### 8.2 - Ajustar pasta uploads também

No `server.js`, atualize a criação da pasta uploads:

```javascript
// Criar diretório de uploads se não existir
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const uploadsDir = isProduction 
  ? path.join('/app/data', 'uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
```

#### 8.3 - Fazer commit e push

```bash
git add .
git commit -m "Ajuste para disco persistente no Render"
git push origin main
```

O Render detectará a mudança e fará **deploy automático**!

---

### **Passo 9: Acessar Seu Site**

Após o deploy concluir, você terá uma URL tipo:

```
https://iep-recrutamento.onrender.com
```

1. Clique na URL no dashboard do Render
2. Aguarde 30-60 segundos (primeira vez é mais lento)
3. Seu sistema estará no ar! 🎉

---

## 🔧 CONFIGURAÇÕES ADICIONAIS

### **Adicionar Domínio Customizado**

1. No dashboard do seu serviço, vá em **"Settings"**
2. Role até **"Custom Domain"**
3. Clique em **"Add Custom Domain"**
4. Digite seu domínio: `recrutamento.seusite.com.br`
5. Configure os DNS conforme instruções do Render

### **Variável de Ambiente para Produção**

Adicione esta variável para otimizar:

```
Key:   NODE_ENV
Value: production
```

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### **Problema 1: Site demora para carregar**
**Causa:** Serviço gratuito "dorme" após 15min de inatividade  
**Solução:** Primeira requisição acorda o serviço (~30s)  
**Opcional:** Use serviço tipo UptimeRobot para fazer ping a cada 5min

### **Problema 2: Dados são perdidos após deploy**
**Causa:** Disco persistente não configurado  
**Solução:** Siga o Passo 6 e 8 acima

### **Problema 3: Build falha com "Cannot find module"**
**Causa:** Dependência faltando no `package.json`  
**Solução:**
```bash
npm install
git add package.json package-lock.json
git commit -m "Fix dependencies"
git push origin main
```

### **Problema 4: Erro "SQLITE_CANTOPEN"**
**Causa:** Permissões ou caminho do banco incorreto  
**Solução:** Verifique que seguiu o Passo 8

### **Problema 5: Uploads não funcionam**
**Causa:** Pasta uploads não está no disco persistente  
**Solução:** Ajuste o caminho conforme Passo 8.2

---

## 📊 MONITORAMENTO

### **Ver Logs em Tempo Real**

1. No dashboard, clique no seu serviço
2. Vá em **"Logs"**
3. Veja erros e informações em tempo real

### **Redeploy Manual**

1. Vá em **"Manual Deploy"**
2. Clique em **"Deploy latest commit"**
3. Aguarde o rebuild

### **Ver Métricas**

1. Vá em **"Metrics"**
2. Veja CPU, memória, requests

---

## 💰 CUSTOS (Plano Free)

```
✅ Web Service: GRATUITO
✅ 750 horas/mês: GRATUITO (suficiente para 1 app 24/7)
✅ SSL (HTTPS): GRATUITO
✅ Deploy automático: GRATUITO
✅ 1 GB disco persistente: GRATUITO
✅ Largura de banda: 100 GB/mês GRATUITO

Total: R$ 0,00/mês 🎉
```

### **Quando Considerar Plano Pago?**

Upgrade se precisar:
- ⚡ Performance melhor (sem "dormir")
- 💾 Mais espaço em disco
- 🚀 Mais largura de banda
- 🔄 Mais serviços simultâneos

**Plano Starter:** $7/mês (~R$ 35)
- Serviço nunca dorme
- 100 GB SSD
- Suporte prioritário

---

## 🔐 SEGURANÇA EM PRODUÇÃO

### **Backup Automático do Banco**

Como o disco é persistente, considere fazer backup periódico:

1. Use Render Cron Job (serviço adicional)
2. Ou faça backup manual mensal:
   - Baixe o arquivo `/app/data/iep_recrutamento.db` via SSH (plano pago)
   - Ou crie endpoint de admin para download

### **Proteger .env**

Nunca suba `.env` no Git! O `.gitignore` já está configurado.

### **HTTPS**

Render fornece SSL gratuito automaticamente. Sempre use:
```
https://iep-recrutamento.onrender.com
```

---

## ✅ CHECKLIST DE DEPLOY NO RENDER

- [ ] Código no GitHub (repositório privado)
- [ ] Conta criada no Render
- [ ] Web Service criado
- [ ] Nome configurado
- [ ] Branch: main
- [ ] Build Command: npm install
- [ ] Start Command: npm start
- [ ] Variável ADMIN_PASSWORD definida
- [ ] Variável PORT definida (10000)
- [ ] Variável NODE_VERSION definida (18)
- [ ] Disco persistente adicionado (1 GB em /app/data)
- [ ] database.js ajustado para usar /app/data
- [ ] server.js ajustado uploads para /app/data
- [ ] Código commitado e pushed
- [ ] Deploy concluído com sucesso
- [ ] URL testada e funcionando
- [ ] Teste de leitura (sem senha) OK
- [ ] Teste de escrita (com senha) OK

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Teste completo do sistema**
   - Cadastre paciente de teste
   - Faça upload de documento
   - Exporte relatório
   - Delete o teste

2. **Compartilhe o link**
   - Envie URL para equipe
   - Guarde senha só para você

3. **Configure backup**
   - Agende backup mensal manual
   - Ou use serviço de backup automático

4. **Monitore uso**
   - Verifique logs semanalmente
   - Acompanhe métricas no dashboard

---

## 📞 SUPORTE

### **Documentação Oficial do Render**
https://render.com/docs

### **Problemas no Deploy?**
1. Veja os logs em tempo real
2. Verifique variáveis de ambiente
3. Confirme que disco persistente está configurado
4. Teste localmente primeiro: `npm start`

### **Comunidade**
- Discord do Render: https://render.com/discord
- Status: https://status.render.com

---

## 🎉 PRONTO!

Seu sistema IEP está agora hospedado no Render de forma **gratuita e permanente**!

**URL do seu sistema:** `https://iep-recrutamento.onrender.com`  
**Senha de admin:** (a que você definiu na variável ADMIN_PASSWORD)

Compartilhe o link com quem precisa visualizar os dados.  
Guarde a senha apenas para você (admin).

---

**Desenvolvido para:** IEP São Lucas  
**Plataforma:** Render.com (Free Tier)  
**Versão:** 8.0 Web Edition  
**Data:** Novembro 2025

