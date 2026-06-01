import * as SQLite from 'expo-sqlite';

// Abre ou cria o banco de dados local
export const db = SQLite.openDatabaseSync('smartfuel_v3.db');

export const inicializarBanco = () => {
  // Tabela de Usuário
  db.execSync(`
    CREATE TABLE IF NOT EXISTS usuario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    );
  `);

  // Tabela de Veículos
  db.execSync(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      capacidade_tanque REAL NOT NULL,
      odometro_inicial REAL NOT NULL,
      combustivel_atual TEXT DEFAULT 'GASOLINA' CHECK(combustivel_atual IN ('ETANOL', 'GASOLINA'))
    );
  `);

  // Tabela de Abastecimentos (Guarda os pontos X, Y da IA)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS abastecimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      veiculo_id INTEGER NOT NULL,
      tipo_combustivel TEXT CHECK(tipo_combustivel IN ('ETANOL', 'GASOLINA')) NOT NULL,
      odometro_atual REAL NOT NULL,
      distancia_percorrida REAL NOT NULL,
      litros_abastecidos REAL NOT NULL,
      preco_por_litro REAL NOT NULL,
      data_registro TEXT NOT NULL,
      tanque_cheio INTEGER DEFAULT 1, -- 1 para Sim, 0 para Não
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
    );
  `);

  // Migração de esquema: adiciona coluna em bancos existentes que ainda não possuem `tanque_cheio`
  const colunasAbastecimentos = db.getAllSync<{ name: string }>("PRAGMA table_info(abastecimentos);");
  const temTanqueCheio = colunasAbastecimentos.some(col => col.name === 'tanque_cheio');

  if (!temTanqueCheio) {
    db.execSync(`ALTER TABLE abastecimentos ADD COLUMN tanque_cheio INTEGER DEFAULT 1;`);
  }

  // Migração de esquema: adiciona coluna combustivel_atual em veiculos existentes
  const colunasVeiculos = db.getAllSync<{ name: string }>("PRAGMA table_info(veiculos);");
  const temCombustivelAtual = colunasVeiculos.some(col => col.name === 'combustivel_atual');

  if (!temCombustivelAtual) {
    db.execSync(`ALTER TABLE veiculos ADD COLUMN combustivel_atual TEXT DEFAULT 'GASOLINA' CHECK(combustivel_atual IN ('ETANOL', 'GASOLINA'));`);
  }
};