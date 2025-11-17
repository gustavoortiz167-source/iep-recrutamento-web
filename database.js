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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS agendamentos (
          id TEXT PRIMARY KEY,
          paciente_id TEXT NOT NULL,
          data TEXT NOT NULL,
          descricao TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Tabela "agendamentos" pronta');

      // Tabela de configurações
      await pool.query(`
        CREATE TABLE IF NOT EXISTS configuracoes (
          chave TEXT PRIMARY KEY,
          valor TEXT,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela "configuracoes" pronta');
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
    sqliteDb.run('PRAGMA foreign_keys = ON');
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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela pacientes:', err);
      else console.log('✅ Tabela "pacientes" pronta');
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
      CREATE TABLE IF NOT EXISTS agendamentos (
        id TEXT PRIMARY KEY,
        paciente_id TEXT NOT NULL,
        data TEXT NOT NULL,
        descricao TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('❌ Erro ao criar tabela agendamentos:', err);
      else console.log('✅ Tabela "agendamentos" pronta');
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
  });

  db = sqliteDb;
}

module.exports = db;
module.exports.usePostgres = usePostgres;
