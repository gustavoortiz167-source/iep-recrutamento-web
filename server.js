require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const db = require('./database');
const { usePostgres } = require('./database');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper: Converter query SQLite (?) para PostgreSQL ($1, $2...)
function convertQuery(sql) {
  if (!usePostgres) return sql;
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

// Helper: Executar query de forma unificada
async function runQuery(sql, params = []) {
  const convertedSql = convertQuery(sql);
  if (usePostgres) {
    const result = await db.pool.query(convertedSql, params);
    return { changes: result.rowCount, lastID: result.rows[0]?.id };
  } else {
    return new Promise((resolve, reject) => {
      db.run(convertedSql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'iep2025@seguro';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'gustavoortiz167@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'gustavoortiz167@gmail.com';
const EDIT_PASSWORD = (process.env.EDIT_PASSWORD || '@iep2025').trim();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Criar diretório de uploads se não existir
const uploadsDir = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim() !== ''
  ? process.env.UPLOADS_DIR
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log(`📁 Uploads: ${uploadsDir}`);
app.use('/uploads', express.static(uploadsDir));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF e Word são aceitos.'));
    }
  }
});

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================

async function getUserFromToken(token){
  if(!token) return null;
  const sql = usePostgres
    ? `SELECT u.* FROM tokens t JOIN usuarios u ON u.id = t.usuario_id WHERE t.token = $1 AND t.expiresAt > NOW()`
    : `SELECT u.* FROM tokens t JOIN usuarios u ON u.id = t.usuario_id WHERE t.token = ? AND datetime(t.expiresAt) > datetime('now')`;
  try{
    const row = await db.get(sql, [token]);
    if(!row) return null;
    if(usePostgres){
      return row;
    }
    return row;
  }catch(e){ return null; }
}

async function requireUser(req,res,next){
  const auth = req.headers['authorization']||'';
  const parts = auth.split(' ');
  const token = parts.length===2 && parts[0]==='Bearer' ? parts[1] : null;
  const user = await getUserFromToken(token);
  if(!user || (user.aprovado===false || user.aprovado===0)){
    return res.status(401).json({error:'Não autorizado'});
  }
  req.user = user;
  next();
}

function requireEdit(req,res,next){ next(); }

function hashPassword(s){
  const salt = process.env.AUTH_SALT || 'iep_salt_2025';
  return crypto.createHash('sha256').update(s + salt).digest('hex');
}

function newToken(){
  return crypto.randomBytes(32).toString('hex');
}

async function createSession(usuarioId){
  const token = newToken();
  const expiresAt = usePostgres ? `NOW() + INTERVAL '7 days'` : null;
  if(usePostgres){
    await db.pool.query(`INSERT INTO tokens (token, usuario_id, expiresAt) VALUES ($1, $2, NOW() + INTERVAL '7 days')`, [token, usuarioId]);
  } else {
    const exp = new Date(Date.now()+7*24*60*60*1000).toISOString().replace('Z','');
    await new Promise((resolve,reject)=>{
      db.run(`INSERT INTO tokens (token, usuario_id, expiresAt) VALUES (?, ?, ?)`, [token, usuarioId, exp], (err)=>{ if(err) reject(err); else resolve(); });
    });
  }
  return token;
}

async function notifyAdminNewUser({nome, login, email}){
  const to = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL || 'gustavo.ortiz@iepsaolucas.com.br';
  const subject = 'Novo cadastro pendente de aprovação - IEP Recrutamento';
  const text = `Novo usuário cadastrado:\nNome: ${nome}\nLogin: ${login}\nEmail: ${email||'-'}\nAcesse o painel de administração para aprovar.`;
  try{
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT||0) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if(host && user && pass){
      const transporter = nodemailer.createTransport({ host, port, secure: port===465, auth:{ user, pass } });
      await transporter.sendMail({ from: user, to, subject, text });
    } else {
      console.log('🔔 Novo cadastro (SMTP não configurado):', {nome, login, email, to});
    }
  }catch(e){ console.error('Erro ao enviar email de novo cadastro:', e); }
}

async function requireAdmin(req,res,next){
  await requireUser(req,res,async ()=>{
    if((req.user.role||'user')!=='admin') return res.status(403).json({error:'Somente administrador'});
    next();
  });
}

// ==================== ROTAS DA API ====================

// GET /api/pacientes - Listar todos os pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM pacientes ORDER BY data DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar pacientes:', err);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
});

// GET /api/pacientes/:id - Buscar paciente por ID
app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = convertQuery('SELECT * FROM pacientes WHERE id = ?');
    const row = await db.get(sql, [id]);
    
    if (!row) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const docSql = convertQuery('SELECT * FROM documentos WHERE paciente_id = ?');
    const docs = await db.all(docSql, [id]);
    
    res.json({ ...row, documentos: docs });
  } catch (err) {
    console.error('Erro ao buscar paciente:', err);
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  }
});

// POST /api/pacientes - Criar novo paciente
app.post('/api/pacientes', requireEdit, upload.array('documentos', 10), async (req, res) => {
  try {
    const {
      id, nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel, comentarios
    } = req.body;

    const allowedStatuses = ['Triagem','Elegível','Randomizado','Não elegível'];
    const allowedStudies = ['Tropion - 8','M-18','Evoke-4','Codebrak','Benito','KER-50','M-20','Symphony'];
    if(!allowedStatuses.includes(status)) return res.status(400).json({error:'Status inválido'});
    if(!allowedStudies.includes(estudo)) return res.status(400).json({error:'Estudo inválido'});

    const pacienteId = id || 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const sql = `
      INSERT INTO pacientes (
        id, nome, status, estudo, data, encaminhador,
        tcleAgendado, tcleAssinado, dataAssinatura,
        elegivel, motivoNaoElegivel, comentarios
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await runQuery(sql, [
      pacienteId, nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel, comentarios
    ]);

    // Salvar documentos se houver
    if (req.files && req.files.length > 0) {
      const docSql = 'INSERT INTO documentos (paciente_id, nome_arquivo, caminho_arquivo, tamanho, tipo) VALUES (?, ?, ?, ?, ?)';
      
      for (const file of req.files) {
        await runQuery(docSql, [
          pacienteId,
          file.originalname,
          file.filename,
          file.size,
          file.mimetype
        ]);
      }
    }

    res.status(201).json({ 
      message: 'Paciente criado com sucesso', 
      id: pacienteId,
      documentos: req.files ? req.files.length : 0
    });
  } catch (err) {
    console.error('Erro ao criar paciente:', err);
    res.status(500).json({ error: 'Erro ao criar paciente' });
  }
});

// PUT /api/pacientes/:id - Atualizar paciente
app.put('/api/pacientes/:id', requireEdit, upload.array('documentos', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel, comentarios
    } = req.body;
    // Atualização: não invalidar registros antigos com valores anteriores.
    // Mantemos validação apenas na criação.

    const sql = `
      UPDATE pacientes SET
        nome = ?, status = ?, estudo = ?, data = ?, encaminhador = ?,
        tcleAgendado = ?, tcleAssinado = ?, dataAssinatura = ?,
        elegivel = ?, motivoNaoElegivel = ?, comentarios = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await runQuery(sql, [
      nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel, comentarios, id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    // Salvar novos documentos se houver
    if (req.files && req.files.length > 0) {
      const docSql = 'INSERT INTO documentos (paciente_id, nome_arquivo, caminho_arquivo, tamanho, tipo) VALUES (?, ?, ?, ?, ?)';
      
      for (const file of req.files) {
        await runQuery(docSql, [
          id,
          file.originalname,
          file.filename,
          file.size,
          file.mimetype
        ]);
      }
    }

    res.json({ 
      message: 'Paciente atualizado com sucesso',
      documentos: req.files ? req.files.length : 0
    });
  } catch (err) {
    console.error('Erro ao atualizar paciente:', err);
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
});

// DELETE /api/pacientes/:id - Deletar paciente
app.delete('/api/pacientes/:id', requireEdit, async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar documentos para deletar arquivos físicos
    const docSql = convertQuery('SELECT caminho_arquivo FROM documentos WHERE paciente_id = ?');
    const docs = await db.all(docSql, [id]);
    
    docs.forEach(doc => {
      const filePath = path.join(uploadsDir, doc.caminho_arquivo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Deletar documentos do banco
    await runQuery('DELETE FROM documentos WHERE paciente_id = ?', [id]);

    // Deletar paciente
    const result = await runQuery('DELETE FROM pacientes WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({ message: 'Paciente deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar paciente:', err);
    res.status(500).json({ error: 'Erro ao deletar paciente' });
  }
});

// GET /api/documentos/:pacienteId - Listar documentos de um paciente
app.get('/api/documentos/:pacienteId', async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const sql = convertQuery('SELECT * FROM documentos WHERE paciente_id = ?');
    const rows = await db.all(sql, [pacienteId]);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar documentos:', err);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
});

// DELETE /api/documentos/:id - Deletar documento
app.delete('/api/documentos/:id', requireEdit, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = convertQuery('SELECT caminho_arquivo FROM documentos WHERE id = ?');
    const doc = await db.get(sql, [id]);

    if (!doc) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Deletar arquivo físico
    const filePath = path.join(uploadsDir, doc.caminho_arquivo);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Deletar do banco
    await runQuery('DELETE FROM documentos WHERE id = ?', [id]);
    res.json({ message: 'Documento deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar documento:', err);
    res.status(500).json({ error: 'Erro ao deletar documento' });
  }
});

// POST /api/configuracoes/logo - Salvar logo
app.post('/api/configuracoes/logo', requireAdmin, async (req, res) => {
  try {
    const { logoData } = req.body;
    
    // PostgreSQL usa ON CONFLICT, SQLite usa INSERT OR REPLACE
    const sql = usePostgres
      ? `INSERT INTO configuracoes (chave, valor, updatedAt) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (chave) DO UPDATE SET valor = $2, updatedAt = CURRENT_TIMESTAMP`
      : `INSERT OR REPLACE INTO configuracoes (chave, valor, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`;

    await runQuery(sql, ['logo', logoData]);
    res.json({ message: 'Logo salvo com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar logo:', err);
    res.status(500).json({ error: 'Erro ao salvar logo' });
  }
});

// GET /api/configuracoes/logo - Buscar logo
app.get('/api/configuracoes/logo', async (req, res) => {
  try {
    const sql = convertQuery('SELECT valor FROM configuracoes WHERE chave = ?');
    const row = await db.get(sql, ['logo']);
    res.json({ logo: row ? row.valor : null });
  } catch (err) {
    console.error('Erro ao buscar logo:', err);
    res.status(500).json({ error: 'Erro ao buscar logo' });
  }
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor IEP Recrutamento rodando!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔐 ADMIN_PASSWORD configurada`);
  if (usePostgres) {
    console.log(`✅ PostgreSQL conectado (dados persistentes)`);
  } else {
    console.log(`✅ SQLite local (dados em iep_recrutamento.db)`);
  }
  console.log(``);
});

// Tratamento de erros
process.on('SIGINT', async () => {
  console.log('\n👋 Encerrando servidor...');
  if (usePostgres) {
    await db.pool.end();
  } else {
    db.close();
  }
  process.exit(0);
});
// ==================== AUTENTICAÇÃO ====================

app.post('/api/auth/register', async (req,res)=>{
  try{
    const {nome,email,login,senha} = req.body;
    if(!nome||!login||!senha) return res.status(400).json({error:'Dados inválidos'});
    const sql = usePostgres
      ? `INSERT INTO usuarios (nome,email,login,senha_hash) VALUES ($1,$2,$3,$4) RETURNING id`
      : `INSERT INTO usuarios (nome,email,login,senha_hash) VALUES (?,?,?,?)`;
    if(usePostgres){
      try{
        const r = await db.pool.query(sql,[nome,email||null,login,hashPassword(senha)]);
        await notifyAdminNewUser({nome, login, email});
        return res.status(201).json({message:'Cadastro enviado para aprovação', id:r.rows[0].id});
      }catch(err){
        if(err.code==='23505') return res.status(409).json({error:'Login já cadastrado'});
        return res.status(500).json({error:'Erro ao cadastrar'});
      }
    } else {
      await new Promise((resolve,reject)=>{ db.run(sql,[nome,email||null,login,hashPassword(senha)], function(err){
        if(err){
          if(String(err.message||'').includes('UNIQUE')) return reject({status:409,error:'Login já cadastrado'});
          return reject({status:500,error:'Erro ao cadastrar'});
        }
        resolve();
      }); }).catch((e)=>{ return res.status(e.status||500).json({error:e.error||'Erro ao cadastrar'}); });
      await notifyAdminNewUser({nome, login, email});
      return res.status(201).json({message:'Cadastro enviado para aprovação'});
    }
  }catch(e){
    return res.status(500).json({error:'Erro ao cadastrar'});
  }
});

app.post('/api/auth/login', async (req,res)=>{
  try{
    const {login,senha} = req.body;
    if(!login||!senha) return res.status(400).json({error:'Dados inválidos'});
    const sql = usePostgres ? `SELECT * FROM usuarios WHERE login = $1` : `SELECT * FROM usuarios WHERE login = ?`;
    const user = await db.get(sql,[login]);
    if(!user) return res.status(404).json({error:'Usuário não encontrado'});
    const ok = (user.senha_hash === hashPassword(senha));
    if(!ok) return res.status(403).json({error:'Credenciais inválidas'});
    if(user.aprovado===false || user.aprovado===0) return res.status(403).json({error:'Usuário não aprovado'});
    const token = await createSession(user.id);
    return res.json({token, user:{id:user.id,nome:user.nome,role:user.role}});
  }catch(e){
    return res.status(500).json({error:'Erro ao autenticar'});
  }
});

app.post('/api/auth/admin-login', (req,res)=>{
  const {senha} = req.body;
  if(!senha) return res.status(400).json({error:'Dados inválidos'});
  if(senha !== ADMIN_PASSWORD) return res.status(403).json({error:'Senha incorreta'});
  (async()=>{
    let admin;
    if(usePostgres){
      const r = await db.pool.query(`SELECT * FROM usuarios WHERE login=$1 LIMIT 1`, [ADMIN_LOGIN]);
      admin = r.rows[0];
    } else {
      admin = await db.get(`SELECT * FROM usuarios WHERE login = ? LIMIT 1`, [ADMIN_LOGIN]);
    }
    if(!admin){
      if(usePostgres){
        const r2 = await db.pool.query(`INSERT INTO usuarios (nome,email,login,senha_hash,role,aprovado) VALUES ($1,$2,$3,$4,'admin',TRUE) RETURNING id`, ['Administrador', ADMIN_EMAIL, ADMIN_LOGIN, hashPassword(senha)]);
        admin = { id: r2.rows[0].id, nome:'Administrador', role:'admin'};
      } else {
        await new Promise((resolve,reject)=>{ db.run(`INSERT INTO usuarios (nome,email,login,senha_hash,role,aprovado) VALUES (?,?,?,?,?,1)`, ['Administrador', ADMIN_EMAIL, ADMIN_LOGIN, hashPassword(senha),'admin'], (err)=>{ if(err) reject(err); else resolve(); }); });
        admin = await db.get(`SELECT * FROM usuarios WHERE login = ? LIMIT 1`, [ADMIN_LOGIN]);
      }
    }
    const token = await createSession(admin.id);
    res.json({token, user:{id:admin.id,nome:admin.nome,role:'admin'}});
  })().catch(()=>res.status(500).json({error:'Erro ao autenticar admin'}));
});

app.get('/api/auth/me', requireUser, (req,res)=>{ res.json({id:req.user.id,nome:req.user.nome,role:req.user.role}); });

app.get('/api/admin/usuarios', requireAdmin, async (req,res)=>{
  try{
    const sql = usePostgres ? `SELECT id,nome,email,login,role,aprovado,createdAt FROM usuarios ORDER BY createdAt DESC` : `SELECT id,nome,email,login,role,aprovado,createdAt FROM usuarios ORDER BY createdAt DESC`;
    const rows = await db.all(sql,[]);
    res.json(rows);
  }catch(e){ res.status(500).json({error:'Erro ao listar usuários'}); }
});

app.post('/api/admin/usuarios/:id/aprovar', requireAdmin, async (req,res)=>{
  try{
    const {id} = req.params;
    if(usePostgres){
      await db.pool.query(`UPDATE usuarios SET aprovado=TRUE, updatedAt=NOW() WHERE id=$1`, [id]);
    } else {
      await new Promise((resolve,reject)=>{ db.run(`UPDATE usuarios SET aprovado=1, updatedAt=CURRENT_TIMESTAMP WHERE id=?`, [id], (err)=>{ if(err) reject(err); else resolve(); }); });
    }
    res.json({message:'Usuário aprovado'});
  }catch(e){ res.status(500).json({error:'Erro ao aprovar usuário'}); }
});

// ==================== AGENDAMENTOS ====================

app.get('/api/agendamentos', async (req,res)=>{
  try{
    const sql = convertQuery('SELECT * FROM agendamentos ORDER BY data ASC');
    const rows = await db.all(sql, []);
    res.json(rows);
  }catch(e){ res.status(500).json({error:'Erro ao buscar agendamentos'}); }
});

app.post('/api/agendamentos', requireEdit, async (req,res)=>{
  try{
    const {paciente_id, data, descricao} = req.body;
    if(!paciente_id) return res.status(400).json({error:'Paciente obrigatório'});
    const checkSql = convertQuery('SELECT id FROM pacientes WHERE id = ?');
    const exists = await db.get(checkSql, [paciente_id]);
    if(!exists) return res.status(400).json({error:'Paciente não cadastrado'});
    const sql = usePostgres
      ? `INSERT INTO agendamentos (paciente_id,data,descricao) VALUES ($1,$2,$3) RETURNING id`
      : `INSERT INTO agendamentos (paciente_id,data,descricao) VALUES (?,?,?)`;
    if(usePostgres){
      const r = await db.pool.query(sql,[paciente_id||null,data,descricao||null]);
      res.status(201).json({message:'Agendamento criado', id:r.rows[0].id});
    } else {
      await new Promise((resolve,reject)=>{ db.run(sql,[paciente_id||null,data,descricao||null], function(err){ if(err) reject(err); else resolve(); }); });
      res.status(201).json({message:'Agendamento criado'});
    }
  }catch(e){ res.status(500).json({error:'Erro ao criar agendamento'}); }
});

app.delete('/api/agendamentos/:id', requireEdit, async (req,res)=>{
  try{
    const {id} = req.params;
    await runQuery('DELETE FROM agendamentos WHERE id = ?', [id]);
    res.json({message:'Agendamento removido'});
  }catch(e){ res.status(500).json({error:'Erro ao remover agendamento'}); }
});
