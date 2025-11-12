const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho do banco de dados
// No plano gratuito do Render, os dados serão perdidos a cada redeploy
// Para disco persistente, é necessário plano premium
const DB_PATH = path.join(__dirname, 'iep_recrutamento.db');

console.log(`📦 Banco de dados: ${DB_PATH}`);

// Conexão com o banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
  }
});

// Criar tabelas se não existirem
db.serialize(() => {
  // Tabela de pacientes
  db.run(`
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
    if (err) {
      console.error('❌ Erro ao criar tabela pacientes:', err);
    } else {
      console.log('✅ Tabela "pacientes" pronta');
    }
  });

  // Tabela de documentos anexados
  db.run(`
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
    if (err) {
      console.error('❌ Erro ao criar tabela documentos:', err);
    } else {
      console.log('✅ Tabela "documentos" pronta');
    }
  });

  // Tabela de configurações (para logo, etc)
  db.run(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela configuracoes:', err);
    } else {
      console.log('✅ Tabela "configuracoes" pronta');
    }
  });
});

module.exports = db;

