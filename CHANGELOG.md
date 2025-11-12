# 📝 Histórico de Alterações

## [2.0.0] - 12/11/2024

### ✨ Adicionado
- Campo "Estudo" alterado de input texto para select dropdown
- Opções predefinidas: "Tropion 7" e "M-18"
- Melhora na experiência do usuário (UX) com seleção padronizada

### 🔧 Motivo
- Evitar erros de digitação nos nomes dos estudos
- Padronizar nomenclatura
- Facilitar análise e relatórios

---

## [1.0.0] - 12/11/2024

### 🎉 Deploy Inicial em Produção
- Sistema de recrutamento e screening IEP em produção no Render
- Banco de dados SQLite funcional
- Upload de documentos (PDF/Word) implementado
- Autenticação por senha para operações de escrita
- Dashboard com indicadores e gráficos
- Exportação de dados (CSV, JSON, PDF)

### 🐛 Correções
- Removidas referências ao registry npm privado (Fury)
- Ajustado código para funcionar no plano gratuito do Render
- Corrigido problema de timeout no npm install
- Atualizado Node.js para versão 20

### 📦 Dependências
- express 4.18.2
- sqlite3 5.1.6
- multer 1.4.5-lts.1
- dotenv 16.6.1
- cors 2.8.5

