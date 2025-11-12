# 📁 Pasta de Uploads

Esta pasta armazena os documentos (PDF e Word) anexados aos pacientes.

## ⚠️ Importante

- **NÃO** suba esta pasta para o Git (contém dados sensíveis de pacientes)
- Faça backup regularmente desta pasta
- Os arquivos são nomeados automaticamente: `doc-TIMESTAMP-RANDOM.ext`

## 📦 Backup

Para fazer backup dos documentos:

```bash
# Criar backup com data
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz uploads/

# Ou copiar para outro local
cp -r uploads/ /caminho/para/backup/
```

## 🔒 Segurança

Esta pasta contém informações confidenciais. Proteja adequadamente:
- Não compartilhe publicamente
- Mantenha permissões restritas no servidor
- Faça backups criptografados

