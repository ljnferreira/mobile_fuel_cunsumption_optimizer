import { db } from '../database/database';
import type { Veiculo } from '../models';

export class VeiculoRepository {
  static findAll(): Veiculo[] {
    try {
      return db.getAllSync<Veiculo>('SELECT * FROM veiculos ORDER BY nome ASC;');
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      return [];
    }
  }

  static findById(id: number): Veiculo | null {
    try {
      return db.getFirstSync<Veiculo>('SELECT * FROM veiculos WHERE id = ?;', [id]) || null;
    } catch (error) {
      console.error('Erro ao buscar veículo por ID:', error);
      return null;
    }
  }

  static insert(nome: string, capacidadeTanque: number, odometroInicial: number, combustivelAtual: 'ETANOL' | 'GASOLINA' = 'GASOLINA'): boolean {
    try {
      db.runSync(
        'INSERT INTO veiculos (nome, capacidade_tanque, odometro_inicial, combustivel_atual) VALUES (?, ?, ?, ?);',
        [nome.trim(), capacidadeTanque, odometroInicial, combustivelAtual]
      );
      return true;
    } catch (error) {
      console.error('Erro ao inserir veículo:', error);
      return false;
    }
  }

  static update(id: number, nome: string, capacidadeTanque: number, odometroInicial: number, combustivelAtual?: 'ETANOL' | 'GASOLINA'): boolean {
    try {
      if (combustivelAtual) {
        db.runSync(
          'UPDATE veiculos SET nome = ?, capacidade_tanque = ?, odometro_inicial = ?, combustivel_atual = ? WHERE id = ?;',
          [nome.trim(), capacidadeTanque, odometroInicial, combustivelAtual, id]
        );
      } else {
        db.runSync(
          'UPDATE veiculos SET nome = ?, capacidade_tanque = ?, odometro_inicial = ? WHERE id = ?;',
          [nome.trim(), capacidadeTanque, odometroInicial, id]
        );
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error);
      return false;
    }
  }

  static delete(id: number): boolean {
    try {
      db.runSync('DELETE FROM veiculos WHERE id = ?;', [id]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      return false;
    }
  }

  static updateCombustivelAtual(id: number, combustivelAtual: 'ETANOL' | 'GASOLINA'): boolean {
    try {
      db.runSync(
        'UPDATE veiculos SET combustivel_atual = ? WHERE id = ?;',
        [combustivelAtual, id]
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar combustível do veículo:', error);
      return false;
    }
  }

  static count(): number {
    try {
      const result = db.getFirstSync<{ total: number }>('SELECT COUNT(*) as total FROM veiculos;');
      return result?.total || 0;
    } catch (error) {
      console.error('Erro ao contar veículos:', error);
      return 0;
    }
  }
}
