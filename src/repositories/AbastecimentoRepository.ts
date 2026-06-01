import { db } from '../database/database';
import type { Abastecimento, MediaConsumo, RelatorioConsumo, AbastecimentoItem } from '../models';

export class AbastecimentoRepository {
  static findMediasConsumoPorVeiculo(veiculoId: number): MediaConsumo[] {
    try {
      return db.getAllSync<MediaConsumo>(
        `SELECT tipo_combustivel, AVG(distancia_percorrida / litros_abastecidos) AS media
         FROM abastecimentos
         WHERE veiculo_id = ? AND tanque_cheio = 1
         GROUP BY tipo_combustivel;`,
        [veiculoId]
      );
    } catch (error) {
      console.error('Erro ao carregar médias de consumo:', error);
      return [];
    }
  }

  static findHistoricoParaPrevisao(
    veiculoId: number,
    tipoCombustivel: 'ETANOL' | 'GASOLINA'
  ): Array<{ distancia_percorrida: number; litros_abastecidos: number }> {
    try {
      return db.getAllSync<{ distancia_percorrida: number; litros_abastecidos: number }>(
        `SELECT distancia_percorrida, litros_abastecidos
         FROM abastecimentos
         WHERE veiculo_id = ? AND tipo_combustivel = ? AND tanque_cheio = 1;`,
        [veiculoId, tipoCombustivel]
      );
    } catch (error) {
      console.error('Erro ao buscar histórico para previsão:', error);
      return [];
    }
  }

  static findUltimoAbastecimentoPorVeiculo(veiculoId: number): { odometro_atual: number; tipo_combustivel: string } | null {
    try {
      return db.getFirstSync<{ odometro_atual: number; tipo_combustivel: string }>(
        'SELECT odometro_atual, tipo_combustivel FROM abastecimentos WHERE veiculo_id = ? ORDER BY id DESC LIMIT 1;',
        [veiculoId]
      ) || null;
    } catch (error) {
      console.error('Erro ao buscar último abastecimento:', error);
      return null;
    }
  }

  static insert(abastecimento: Omit<Abastecimento, 'id' | 'data_registro'> & { data_registro: string }): boolean {
    try {
      db.runSync(
        `INSERT INTO abastecimentos (
          veiculo_id, tipo_combustivel, odometro_atual, distancia_percorrida,
          litros_abastecidos, preco_por_litro, data_registro, tanque_cheio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          abastecimento.veiculo_id,
          abastecimento.tipo_combustivel,
          abastecimento.odometro_atual,
          abastecimento.distancia_percorrida,
          abastecimento.litros_abastecidos,
          abastecimento.preco_por_litro,
          abastecimento.data_registro,
          abastecimento.tanque_cheio,
        ]
      );
      return true;
    } catch (error) {
      console.error('Erro ao inserir abastecimento:', error);
      return false;
    }
  }

  static findHistoricoCompleto(): AbastecimentoItem[] {
    try {
      return db.getAllSync<AbastecimentoItem>(
        `SELECT 
           a.id,
           v.nome as carro_nome,
           a.tipo_combustivel,
           a.distancia_percorrida,
           a.litros_abastecidos,
           a.preco_por_litro,
           a.data_registro,
           a.tanque_cheio
         FROM abastecimentos a
         JOIN veiculos v ON a.veiculo_id = v.id
         ORDER BY a.id DESC;`
      );
    } catch (error) {
      console.error('Erro ao carregar histórico completo:', error);
      return [];
    }
  }

  static findHistoricoCompletoPorVeiculo(veiculoId: number): AbastecimentoItem[] {
    try {
      return db.getAllSync<AbastecimentoItem>(
        `SELECT 
           a.id,
           v.nome as carro_nome,
           a.tipo_combustivel,
           a.distancia_percorrida,
           a.litros_abastecidos,
           a.preco_por_litro,
           a.data_registro,
           a.tanque_cheio
         FROM abastecimentos a
         JOIN veiculos v ON a.veiculo_id = v.id
         WHERE a.veiculo_id = ?
         ORDER BY a.id DESC;`,
        [veiculoId]
      );
    } catch (error) {
      console.error('Erro ao carregar histórico do veículo:', error);
      return [];
    }
  }

  static findMetricasAnaliticas(): RelatorioConsumo[] {
    try {
      return db.getAllSync<RelatorioConsumo>(
        `SELECT 
           tipo_combustivel,
           AVG(distancia_percorrida / litros_abastecidos) as media_km_litro,
           SUM(litros_abastecidos) as total_litros,
           SUM(litros_abastecidos * preco_por_litro) as gasto_total
         FROM abastecimentos
         WHERE tanque_cheio = 1
         GROUP BY tipo_combustivel;`
      );
    } catch (error) {
      console.error('Erro ao carregar métricas analíticas:', error);
      return [];
    }
  }

  static findMetricasAnaliticasPorVeiculo(veiculoId: number): RelatorioConsumo[] {
    try {
      return db.getAllSync<RelatorioConsumo>(
        `SELECT 
           tipo_combustivel,
           AVG(distancia_percorrida / litros_abastecidos) as media_km_litro,
           SUM(litros_abastecidos) as total_litros,
           SUM(litros_abastecidos * preco_por_litro) as gasto_total
         FROM abastecimentos
         WHERE veiculo_id = ? AND tanque_cheio = 1
         GROUP BY tipo_combustivel;`,
        [veiculoId]
      );
    } catch (error) {
      console.error('Erro ao carregar métricas analíticas por veículo:', error);
      return [];
    }
  }

  static deleteByVeiculo(veiculoId: number): boolean {
    try {
      db.runSync('DELETE FROM abastecimentos WHERE veiculo_id = ?;', [veiculoId]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar histórico de abastecimentos do veículo:', error);
      return false;
    }
  }

  static delete(id: number): boolean {
    try {
      db.runSync('DELETE FROM abastecimentos WHERE id = ?;', [id]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar abastecimento:', error);
      return false;
    }
  }

  static count(): number {
    try {
      const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM abastecimentos;');
      return result?.count || 0;
    } catch (error) {
      console.error('Erro ao contar abastecimentos:', error);
      return 0;
    }
  }
}
