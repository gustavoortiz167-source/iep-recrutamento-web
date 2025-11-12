# ✅ Checklist de Deploy no Render

Use esta lista para garantir que tudo está configurado corretamente.

---

## 📋 ANTES DO DEPLOY

### 1. Preparação do Código
- [ ] Código funcionando localmente (`npm start`)
- [ ] Testado criação de pacientes
- [ ] Testado upload de arquivos
- [ ] Senha forte definida para produção

### 2. GitHub
- [ ] Repositório criado no GitHub
- [ ] Repositório configurado como **PRIVADO** (dados sensíveis!)
- [ ] Código commitado: `git add . && git commit -m "Deploy"`
- [ ] Código enviado: `git push origin main`

---

## 🚀 DURANTE O DEPLOY

### 3. Conta Render
- [ ] Conta criada em https://render.com
- [ ] Login feito com GitHub (mais fácil)
- [ ] Render autorizado a acessar repositórios

### 4. Criar Web Service
- [ ] Clicado em "New +" → "Web Service"
- [ ] Repositório `iep-recrutamento-web` selecionado
- [ ] Clicado em "Connect"

### 5. Configurações Básicas
- [ ] **Name:** `iep-recrutamento` (ou outro nome)
- [ ] **Region:** `Frankfurt` ou `Oregon`
- [ ] **Branch:** `main`
- [ ] **Runtime:** `Node`
- [ ] **Build Command:** `npm install`
- [ ] **Start Command:** `npm start`
- [ ] **Instance Type:** `Free` ✅

### 6. Variáveis de Ambiente
- [ ] **ADMIN_PASSWORD:** (sua senha forte)
- [ ] **PORT:** `10000`
- [ ] **NODE_VERSION:** `18`
- [ ] **NODE_ENV:** `production` (opcional)

### 7. Disco Persistente (CRÍTICO!)
- [ ] Clicado em "Add Disk"
- [ ] **Name:** `data`
- [ ] **Mount Path:** `/app/data`
- [ ] **Size:** `1 GB`
- [ ] Disco salvo com sucesso

### 8. Deploy
- [ ] Clicado em "Create Web Service"
- [ ] Aguardado conclusão (5-10 min)
- [ ] Build concluído com sucesso ✅
- [ ] Logs sem erros críticos

---

## 🧪 APÓS O DEPLOY

### 9. Testes de Acesso
- [ ] URL aberta no navegador
- [ ] Sistema carregou (pode demorar 30s na primeira vez)
- [ ] Logo aparece corretamente
- [ ] Interface está completa

### 10. Testes de Leitura (Sem Senha)
- [ ] Consegue ver página inicial
- [ ] Consegue ver lista vazia de pacientes
- [ ] Consegue ver indicadores (zeros)
- [ ] Consegue ver gráfico

### 11. Testes de Escrita (Com Senha)
- [ ] Clicou em "Adicionar paciente"
- [ ] Apareceu prompt: "🔐 Digite a senha de administrador"
- [ ] Digitou senha configurada
- [ ] Senha aceita com sucesso
- [ ] Cadastrou paciente de teste
- [ ] Paciente apareceu na tabela ✅

### 12. Testes de Upload
- [ ] Editou paciente
- [ ] Anexou arquivo PDF de teste
- [ ] Upload concluído com sucesso
- [ ] Arquivo salvo (verificar logs ou tamanho)

### 13. Testes de Persistência
- [ ] Aguardou 1 minuto
- [ ] Recarregou página (F5)
- [ ] Dados ainda estão lá ✅
- [ ] Paciente de teste continua cadastrado

---

## 🔧 CONFIGURAÇÕES EXTRAS (OPCIONAL)

### 14. Domínio Customizado
- [ ] Foi em Settings → Custom Domain
- [ ] Adicionou domínio próprio
- [ ] Configurou DNS conforme instruções
- [ ] Aguardou propagação DNS (24-48h)
- [ ] HTTPS funcionando no domínio

### 15. Monitoramento
- [ ] Verificou logs no Render
- [ ] Sem erros críticos
- [ ] Sistema respondendo corretamente

### 16. Backup
- [ ] Anotou onde está o banco: `/app/data/iep_recrutamento.db`
- [ ] Definiu rotina de backup mensal
- [ ] Testou exportação de dados (CSV/JSON)

---

## 🎯 FINALIZAÇÃO

### 17. Documentação
- [ ] Anotou URL do sistema
- [ ] Anotou senha de admin (local seguro!)
- [ ] Documentou para equipe como acessar

### 18. Compartilhamento
- [ ] Enviou URL para equipe
- [ ] Explicou que leitura é livre
- [ ] Explicou que alterações precisam de senha
- [ ] Senha guardada apenas com você

### 19. Limpeza
- [ ] Deletou paciente de teste
- [ ] Sistema está limpo e pronto para uso real

---

## 🐛 SE ALGO DEU ERRADO

### Problemas Comuns:

**Build falhou?**
- [ ] Verifique logs do Render
- [ ] Confirme que `package.json` está correto
- [ ] Rode `npm install` localmente para testar

**Dados não persistem?**
- [ ] Confirme disco persistente configurado
- [ ] Verifique Mount Path: `/app/data`
- [ ] Veja logs se está usando caminho correto

**Senha não funciona?**
- [ ] Verifique variável `ADMIN_PASSWORD` no Render
- [ ] Confirme que não tem espaços extras
- [ ] Tente redeployar

**Upload não funciona?**
- [ ] Confirme que pasta uploads está em `/app/data/uploads`
- [ ] Veja logs de erro
- [ ] Confirme permissões

---

## ✅ CHECKLIST RÁPIDO

```
□ Código no GitHub (privado)
□ Conta no Render criada
□ Web Service configurado
□ Variáveis de ambiente OK
□ Disco persistente configurado
□ Deploy concluído
□ Testes de leitura OK
□ Testes de escrita OK
□ URL compartilhada
□ Senha guardada
```

---

## 🎉 TUDO PRONTO?

Se todos os itens acima estão marcados, **parabéns!** 🎊

Seu sistema está:
- ✅ No ar
- ✅ Funcionando
- ✅ Seguro
- ✅ Gratuito
- ✅ Pronto para uso

**Próximo passo:** Comece a usar para valer!

---

**Referência:** Veja `RENDER_DEPLOY.md` para detalhes completos

