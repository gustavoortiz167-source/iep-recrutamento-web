# 🏥 Sistema de Recrutamento & Screening - IEP São Lucas

Sistema web completo para gerenciamento de recrutamento e triagem de pacientes para estudos clínicos, com banco de dados persistente e upload de documentos.

## 📋 Funcionalidades

- ✅ **Cadastro completo de pacientes** com todos os dados necessários
- 📁 **Upload de documentos** (PDF e Word) anexados aos pacientes
- 📊 **Indicadores e estatísticas** em tempo real
- 📈 **Gráficos interativos** de distribuição por status
- 🔍 **Filtros por período** (mês/ano)
- 💾 **Banco de dados SQLite** persistente
- 🎨 **Interface moderna e responsiva**
- 📤 **Exportação de relatórios** (CSV, JSON, PDF)
- 🔒 **Armazenamento seguro** de arquivos no servidor

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Plataforma JavaScript server-side
- **Express** - Framework web minimalista
- **SQLite3** - Banco de dados SQL leve e rápido
- **Multer** - Middleware para upload de arquivos
- **CORS** - Controle de acesso entre origens

### Frontend
- **HTML5** + **CSS3** + **JavaScript ES6+**
- **Chart.js** - Gráficos interativos
- **jsPDF** - Geração de PDFs
- **Fetch API** - Comunicação com o servidor

## 📦 Instalação

### Pré-requisitos

- **Node.js** versão 14 ou superior ([Download aqui](https://nodejs.org/))
- **npm** (incluído com Node.js)

### Passo a passo

1. **Navegue até a pasta do projeto:**
```bash
cd /Users/fefnnascimen/Downloads/iep-recrutamento-web
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor:**
```bash
npm start
```

4. **Acesse o sistema:**
   - Abra seu navegador e acesse: **http://localhost:3000**

## 🚀 Executando o Sistema

### Modo produção (recomendado)
```bash
npm start
```

### Modo desenvolvimento (com auto-reload)
```bash
npm run dev
```

## 📂 Estrutura do Projeto

```
iep-recrutamento-web/
├── server.js              # Servidor Express e rotas da API
├── database.js            # Configuração do banco SQLite
├── package.json           # Dependências e scripts
├── public/
│   └── index.html        # Interface do usuário (frontend)
├── uploads/              # Arquivos enviados pelos usuários
├── iep_recrutamento.db   # Banco de dados (criado automaticamente)
└── README.md             # Esta documentação
```

## 🔌 API REST

O sistema disponibiliza os seguintes endpoints:

### Pacientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/pacientes` | Lista todos os pacientes |
| `GET` | `/api/pacientes/:id` | Busca paciente por ID |
| `POST` | `/api/pacientes` | Cria novo paciente (+ upload) |
| `PUT` | `/api/pacientes/:id` | Atualiza paciente (+ upload) |
| `DELETE` | `/api/pacientes/:id` | Remove paciente |

### Documentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/documentos/:pacienteId` | Lista documentos do paciente |
| `DELETE` | `/api/documentos/:id` | Remove documento |

### Configurações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/configuracoes/logo` | Salva logo personalizado |
| `GET` | `/api/configuracoes/logo` | Recupera logo |

## 💾 Banco de Dados

O sistema utiliza **SQLite** com 3 tabelas principais:

### `pacientes`
Armazena todos os dados dos pacientes (nome, status, estudo, elegibilidade, etc.)

### `documentos`
Armazena metadados dos arquivos anexados (nome, caminho, tamanho, tipo)

### `configuracoes`
Armazena configurações do sistema (logo, etc.)

## 📤 Upload de Arquivos

- **Formatos aceitos:** PDF (`.pdf`), Word (`.doc`, `.docx`)
- **Tamanho máximo:** 10 MB por arquivo
- **Múltiplos arquivos:** Suportado
- **Armazenamento:** Pasta `uploads/` no servidor

## 🔧 Configuração Avançada

### Mudar porta do servidor

Edite o arquivo `server.js` na linha:
```javascript
const PORT = process.env.PORT || 3000;
```

Ou defina a variável de ambiente:
```bash
PORT=8080 npm start
```

### Backup do banco de dados

O arquivo `iep_recrutamento.db` contém todos os dados. Para fazer backup:
```bash
cp iep_recrutamento.db backup_$(date +%Y%m%d).db
```

## 📊 Exportação de Dados

O sistema permite exportar indicadores em 3 formatos:
- **CSV** - Para Excel/planilhas
- **JSON** - Para integração com outros sistemas
- **PDF** - Para relatórios impressos

## 🐛 Solução de Problemas

### Porta 3000 já está em uso
```bash
# No macOS/Linux, encontre e encerre o processo:
lsof -ti:3000 | xargs kill

# Ou use outra porta:
PORT=3001 npm start
```

### Erro ao instalar dependências
```bash
# Limpe o cache do npm e reinstale:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Banco de dados corrompido
```bash
# Remova o banco e reinicie (ATENÇÃO: apaga todos os dados):
rm iep_recrutamento.db
npm start
```

## 🔐 Segurança

⚠️ **Importante para produção:**
- Configure autenticação de usuários
- Use HTTPS (TLS/SSL)
- Implemente controle de acesso (roles)
- Configure firewall e limite de taxa (rate limiting)
- Faça backups regulares do banco de dados

## 📝 Licença

Este sistema foi desenvolvido para uso interno do **IEP São Lucas**.

## 👥 Suporte

Para dúvidas ou problemas:
- Consulte esta documentação
- Verifique os logs do servidor no console
- Entre em contato com a equipe de TI

---

**Versão:** 8.0 (Web Edition)  
**Última atualização:** Novembro 2025  
**Desenvolvido para:** IEP São Lucas

