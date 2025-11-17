require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const db = require('./database');
const { usePostgres } = require('./database');

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

async function fetchAll(sql, params = []){
  const convertedSql = convertQuery(sql);
  if (usePostgres) {
    return db.all(convertedSql, params);
  } else {
    return new Promise((resolve, reject) => {
      db.all(convertedSql, params, (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
  }
}

async function fetchGet(sql, params = []){
  const convertedSql = convertQuery(sql);
  if (usePostgres) {
    return db.get(convertedSql, params);
  } else {
    return new Promise((resolve, reject) => {
      db.get(convertedSql, params, (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log(`📁 Uploads: ${uploadsDir}`);

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

function requireAuth(req, res, next) { next(); }

// ==================== ROTAS DA API ====================

// GET /api/pacientes - Listar todos os pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    const rows = await fetchAll('SELECT * FROM pacientes ORDER BY data DESC');
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
    const sql = 'SELECT * FROM pacientes WHERE id = ?';
    const row = await fetchGet(sql, [id]);
    
    if (!row) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const docSql = 'SELECT * FROM documentos WHERE paciente_id = ?';
    const docs = await fetchAll(docSql, [id]);
    
    res.json({ ...row, documentos: docs });
  } catch (err) {
    console.error('Erro ao buscar paciente:', err);
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  }
});

// POST /api/pacientes - Criar novo paciente
app.post('/api/pacientes', requireAuth, upload.array('documentos', 10), async (req, res) => {
  try {
    const {
      id, nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel
    } = req.body;

    const pacienteId = id || 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const sql = `
      INSERT INTO pacientes (
        id, nome, status, estudo, data, encaminhador,
        tcleAgendado, tcleAssinado, dataAssinatura,
        elegivel, motivoNaoElegivel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await runQuery(sql, [
      pacienteId, nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel
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
app.put('/api/pacientes/:id', requireAuth, upload.array('documentos', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel
    } = req.body;

    const sql = `
      UPDATE pacientes SET
        nome = ?, status = ?, estudo = ?, data = ?, encaminhador = ?,
        tcleAgendado = ?, tcleAssinado = ?, dataAssinatura = ?,
        elegivel = ?, motivoNaoElegivel = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await runQuery(sql, [
      nome, status, estudo, data, encaminhador,
      tcleAgendado, tcleAssinado, dataAssinatura,
      elegivel, motivoNaoElegivel, id
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
app.delete('/api/pacientes/:id', requireAuth, async (req, res) => {
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
    const sql = 'SELECT * FROM documentos WHERE paciente_id = ?';
    const rows = await fetchAll(sql, [pacienteId]);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar documentos:', err);
    res.status(500).json({ error: 'Erro ao buscar documentos' });
  }
});

// DELETE /api/documentos/:id - Deletar documento
app.delete('/api/documentos/:id', requireAuth, async (req, res) => {
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
app.post('/api/configuracoes/logo', requireAuth, async (req, res) => {
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
    const sql = 'SELECT valor FROM configuracoes WHERE chave = ?';
    const row = await fetchGet(sql, ['logo']);
    res.json({ logo: row ? row.valor : null });
  } catch (err) {
    console.error('Erro ao buscar logo:', err);
    res.status(500).json({ error: 'Erro ao buscar logo' });
  }
});

app.get('/api/agendamentos', async (req, res) => {
  try {
    const rows = await fetchAll('SELECT * FROM agendamentos ORDER BY data ASC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar agendamentos:', err);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

app.post('/api/agendamentos', async (req, res) => {
  try {
    const { paciente_id, data, descricao } = req.body;
    if (!paciente_id || !data) { return res.status(400).json({ error: 'paciente_id e data são obrigatórios' }); }
    const id = 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const sql = 'INSERT INTO agendamentos (id, paciente_id, data, descricao) VALUES (?, ?, ?, ?)';
    await runQuery(sql, [id, paciente_id, data, descricao]);
    res.status(201).json({ id, paciente_id, data, descricao });
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await runQuery('DELETE FROM agendamentos WHERE id = ?', [id]);
    if (result.changes === 0) { return res.status(404).json({ error: 'Agendamento não encontrado' }); }
    res.json({ message: 'Agendamento removido' });
  } catch (err) {
    console.error('Erro ao remover agendamento:', err);
    res.status(500).json({ error: 'Erro ao remover agendamento' });
  }
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor IEP Recrutamento rodando!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔓 Acesso aberto (sem senha para operações)`);
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
