import { db } from '../database/database';

export interface Veiculo {
  id: number;
  nome: string;
  capacidade_tanque: number;
  odometro_inicial: number;
}

export class VeiculoService {
  /**
   * Carrega todos os veículos do banco de dados
   */
  static carregarTodos(): Veiculo[] {
    try {
      const veiculos = db.getAllSync<Veiculo>(
        'SELECT * FROM veiculos ORDER BY nome ASC;'
      );
      return veiculos;
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      return [];
    }
  }

  /**
   * Carrega um veículo específico por ID
   */
  static carregarPorId(id: number): Veiculo | null {
    try {
      const veiculo = db.getFirstSync<Veiculo>(
        'SELECT * FROM veiculos WHERE id = ?;',
        [id]
      );
      return veiculo || null;
    } catch (error) {
      console.error('Erro ao carregar veículo:', error);
      return null;
    }
  }

  /**
   * Cadastra um novo veículo
   */
  static cadastrar(
    nome: string,
    capacidadeTanque: number,
    odometroInicial: number
  ): { sucesso: boolean; id?: number; erro?: string } {
    try {
      if (!nome.trim()) {
        return { sucesso: false, erro: 'Nome do veículo é obrigatório' };
      }

      if (capacidadeTanque <= 0) {
        return { sucesso: false, erro: 'Capacidade do tanque deve ser maior que 0' };
      }

      if (odometroInicial < 0) {
        return { sucesso: false, erro: 'Odômetro não pode ser negativo' };
      }

      db.runSync(
        'INSERT INTO veiculos (nome, capacidade_tanque, odometro_inicial) VALUES (?, ?, ?);',
        [nome.trim(), capacidadeTanque, odometroInicial]
      );

      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      return { sucesso: false, erro: 'Erro ao salvar veículo no banco' };
    }
  }

  /**
   * Atualiza um veículo existente
   */
  static atualizar(
    id: number,
    nome: string,
    capacidadeTanque: number,
    odometroInicial: number
  ): { sucesso: boolean; erro?: string } {
    try {
      if (!nome.trim()) {
        return { sucesso: false, erro: 'Nome do veículo é obrigatório' };
      }

      db.runSync(
        'UPDATE veiculos SET nome = ?, capacidade_tanque = ?, odometro_inicial = ? WHERE id = ?;',
        [nome.trim(), capacidadeTanque, odometroInicial, id]
      );

      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error);
      return { sucesso: false, erro: 'Erro ao atualizar veículo' };
    }
  }

  /**
   * Deleta um veículo
   */
  static deletar(id: number): { sucesso: boolean; erro?: string } {
    try {
      db.runSync('DELETE FROM veiculos WHERE id = ?;', [id]);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      return { sucesso: false, erro: 'Erro ao deletar veículo' };
    }
  }

  /**
   * Conta o total de veículos
   */
  static contarTotal(): number {
    try {
      const resultado = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM veiculos;'
      );
      return resultado?.count || 0;
    } catch (error) {
      console.error('Erro ao contar veículos:', error);
      return 0;
    }
  }
}
