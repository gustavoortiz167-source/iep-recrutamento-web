const path = require('path');
const fs = require('fs');

// Detectar se deve usar PostgreSQL (produção) ou SQLite (local)
const DATABASE_URL = process.env.DATABASE_URL;
const usePostgres = !!DATABASE_URL;

console.log(`🔍 Modo: ${usePostgres ? 'PostgreSQL (Produção)' : 'SQLite (Local)'}`);

let db;

if (usePostgres) {
  // ============================================
  // POSTGRESQL (PRODUÇÃO - RENDER)
  // ============================================
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  console.log(`📦 Banco de dados: PostgreSQL (Render)`);

  // Criar tabelas PostgreSQL
  (async () => {
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Conectado ao banco de dados PostgreSQL');

      // Tabela de pacientes
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pacientes (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          status TEXT NOT NULL,
          estudo TEXT NOT NULL,
          data TEXT NOT NULL,
          encaminhador TEXT,
          tcleAgendado TEXT,
          tcleAssinado TEXT,
          dataAssinatura TEXT,
          elegivel TEXT,
          motivoNaoElegivel TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela "pacientes" pronta');

      // Tabela de documentos
      await pool.query(`
        CREATE TABLE IF NOT EXISTS documentos (
          id SERIAL PRIMARY KEY,
          paciente_id TEXT NOT NULL,
          nome_arquivo TEXT NOT NULL,
          caminho_arquivo TEXT NOT NULL,
          tamanho INTEGER,
          tipo TEXT,
          uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Tabela "documentos" pronta');

      // Tabela de configurações
      await pool.query(`
        CREATE TABLE IF NOT EXISTS configuracoes (
          chave TEXT PRIMARY KEY,
          valor TEXT,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela "configuracoes" pronta');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          email TEXT,
          login TEXT UNIQUE NOT NULL,
          senha_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          aprovado BOOLEAN DEFAULT FALSE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela "usuarios" pronta');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS tokens (
          token TEXT PRIMARY KEY,
          usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
          expiresAt TIMESTAMP NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela "tokens" pronta');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS agendamentos (
          id SERIAL PRIMARY KEY,
          paciente_id TEXT,
          data TEXT NOT NULL,
          descricao TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela "agendamentos" pronta');

      await pool.query(`
        ALTER TABLE pacientes ADD COLUMN comentarios TEXT
      `).catch(() => {});
      console.log('✅ Coluna "comentarios" em pacientes pronta');
    } catch (err) {
      console.error('❌ Erro ao configurar PostgreSQL:', err);
    }
  })();

  // Wrapper para manter compatibilidade com API do SQLite
  db = {
    // Query genérica
    query: (sql, params = []) => pool.query(sql, params),
    
    // Métodos compatíveis com SQLite
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        pool.query(sql, params)
          .then(result => resolve(result.rows))
          .catch(err => reject(err));
      });
    },
    
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        pool.query(sql, params)
          .then(result => resolve(result.rows[0]))
          .catch(err => reject(err));
      });
    },
    
    run: (sql, params = [], callback) => {
      pool.query(sql, params)
        .then(result => {
          if (callback) callback(null, result);
        })
        .catch(err => {
          if (callback) callback(err);
        });
    },

    // Pool original para queries avançadas
    pool: pool
  };

} else {
  // ============================================
  // SQLITE (DESENVOLVIMENTO LOCAL)
  // ============================================
  const sqlite3 = require('sqlite3').verbose();
  
  const DB_PATH = path.join(__dirname, 'iep_recrutamento.db');
  console.log(`📦 Banco de dados: ${DB_PATH}`);

  const sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Erro ao conectar ao banco de dados:', err);
    } else {
      console.log('✅ Conectado ao banco de dados SQLite');
    }
  });

  // Criar tabelas SQLite
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        status TEXT NOT NULL,
        estudo TEXT NOT NULL,
        data TEXT NOT NULL,
        encaminhador TEXT,
        tcleAgendado TEXT,
        tcleAssinado TEXT,
        dataAssinatura TEXT,
        elegivel TEXT,
        motivoNaoElegivel TEXT,
        comentarios TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela pacientes:', err);
      else console.log('✅ Tabela "pacientes" pronta');
    });

    sqliteDb.run(`ALTER TABLE pacientes ADD COLUMN comentarios TEXT`, (err) => {
      if (!err) console.log('✅ Coluna "comentarios" adicionada em pacientes (SQLite)');
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS documentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id TEXT NOT NULL,
        nome_arquivo TEXT NOT NULL,
        caminho_arquivo TEXT NOT NULL,
        tamanho INTEGER,
        tipo TEXT,
        uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela documentos:', err);
      else console.log('✅ Tabela "documentos" pronta');
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY,
        valor TEXT,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela configuracoes:', err);
      else console.log('✅ Tabela "configuracoes" pronta');
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT,
        login TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        aprovado INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela usuarios:', err);
      else console.log('✅ Tabela "usuarios" pronta');
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        token TEXT PRIMARY KEY,
        usuario_id INTEGER,
        expiresAt TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela tokens:', err);
      else console.log('✅ Tabela "tokens" pronta');
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id TEXT,
        data TEXT NOT NULL,
        descricao TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela agendamentos:', err);
      else console.log('✅ Tabela "agendamentos" pronta');
    });
  });

  db = sqliteDb;
}

module.exports = db;
module.exports.usePostgres = usePostgres;
