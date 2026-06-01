import { db } from '../database/database';
import { predizerConsumoKmL } from '../domain/inteligencia';

export interface Abastecimento {
  id: number;
  veiculo_id: number;
  tipo_combustivel: 'ETANOL' | 'GASOLINA';
  odometro_atual: number;
  distancia_percorrida: number;
  litros_abastecidos: number;
  preco_por_litro: number;
  data_registro: string;
  tanque_cheio: number;
}

export interface MediaConsumo {
  tipo_combustivel: string;
  media: number;
}

export interface RelatorioConsumo {
  tipo_combustivel: string;
  media_km_litro: number;
  total_litros: number;
  gasto_total: number;
}

export interface AbastecimentoItem {
  id: number;
  carro_nome: string;
  tipo_combustivel: string;
  distancia_percorrida: number;
  litros_abastecidos: number;
  preco_por_litro: number;
  data_registro: string;
  tanque_cheio: number;
}

export class AbastecimentoService {
  /**
   * Carrega todas as médias de consumo para um veículo específico
   * Utiliza apenas abastecimentos com tanque cheio para precisão
   */
  static carregarMediasConsumoPorVeiculo(
    veiculoId: number
  ): Map<'ETANOL' | 'GASOLINA', number> {
    try {
      const query = `
        SELECT tipo_combustivel, AVG(distancia_percorrida / litros_abastecidos) AS media
        FROM abastecimentos
        WHERE veiculo_id = ? AND tanque_cheio = 1
        GROUP BY tipo_combustivel;
      `;

      const medias = db.getAllSync<MediaConsumo>(query, [veiculoId]);
      const mapaMedias = new Map<'ETANOL' | 'GASOLINA', number>();

      medias.forEach((item) => {
        if (item.tipo_combustivel === 'ETANOL' || item.tipo_combustivel === 'GASOLINA') {
          mapaMedias.set(item.tipo_combustivel as 'ETANOL' | 'GASOLINA', item.media);
        }
      });

      return mapaMedias;
    } catch (error) {
      console.error('Erro ao carregar médias de consumo:', error);
      return new Map();
    }
  }

  /**
   * Carrega o histórico de abastecimentos para cálculo de previsão (IA)
   */
  static carregarHistoricoPariaPrevisao(
    veiculoId: number,
    tipoCombustivel: 'ETANOL' | 'GASOLINA'
  ): Array<{ distanciaPercorrida: number; litrosAbastecidos: number }> {
    try {
      const query = `
        SELECT distancia_percorrida, litros_abastecidos
        FROM abastecimentos
        WHERE veiculo_id = ? AND tipo_combustivel = ? AND tanque_cheio = 1;
      `;

      const historico = db.getAllSync<{
        distancia_percorrida: number;
        litros_abastecidos: number;
      }>(query, [veiculoId, tipoCombustivel]);

      return historico.map((h) => ({
        distanciaPercorrida: h.distancia_percorrida,
        litrosAbastecidos: h.litros_abastecidos,
      }));
    } catch (error) {
      console.error('Erro ao carregar histórico para previsão:', error);
      return [];
    }
  }

  /**
   * Calcula o consumo automaticamente usando IA (Regressão Linear)
   * Retorna as médias preditas por tipo de combustível
   */
  static calcularConsumoOtimizadoPorIA(veiculoId: number): {
    etanol: number;
    gasolina: number;
    ativeIA: boolean;
  } {
    try {
      const histEtanol = this.carregarHistoricoPariaPrevisao(veiculoId, 'ETANOL');
      const histGasolina = this.carregarHistoricoPariaPrevisao(
        veiculoId,
        'GASOLINA'
      );

      const predicaoEtanol = predizerConsumoKmL(histEtanol);
      const predicaoGasolina = predizerConsumoKmL(histGasolina);

      const ativeIA = predicaoEtanol > 0 && predicaoGasolina > 0;

      return {
        etanol: predicaoEtanol > 0 ? predicaoEtanol : 7.5,
        gasolina: predicaoGasolina > 0 ? predicaoGasolina : 10.5,
        ativeIA,
      };
    } catch (error) {
      console.error('Erro ao calcular consumo otimizado:', error);
      return {
        etanol: 7.5,
        gasolina: 10.5,
        ativeIA: false,
      };
    }
  }

  /**
   * Obtém o último odômetro registrado para um veículo
   */
  static obterUltimoOdometro(veiculoId: number): number | null {
    try {
      const resultado = db.getFirstSync<{ odometro_atual: number }>(
        'SELECT odometro_atual FROM abastecimentos WHERE veiculo_id = ? ORDER BY id DESC LIMIT 1;',
        [veiculoId]
      );

      return resultado?.odometro_atual || null;
    } catch (error) {
      console.error('Erro ao obter último odômetro:', error);
      return null;
    }
  }

  /**
   * Obtém o odômetro inicial de um veículo
   */
  static obterOdometroInicial(veiculoId: number): number | null {
    try {
      const resultado = db.getFirstSync<{ odometro_inicial: number }>(
        'SELECT odometro_inicial FROM veiculos WHERE id = ?;',
        [veiculoId]
      );

      return resultado?.odometro_inicial || null;
    } catch (error) {
      console.error('Erro ao obter odômetro inicial:', error);
      return null;
    }
  }

  /**
   * Calcula a distância percorrida entre dois pontos
   */
  static calcularDistancia(
    veiculoId: number,
    odometroAtual: number
  ): { distancia: number; erro?: string } {
    try {
      const ultimoOdometro = this.obterUltimoOdometro(veiculoId);

      let distancia = 0;

      if (ultimoOdometro !== null) {
        distancia = odometroAtual - ultimoOdometro;
      } else {
        const odometroInicial = this.obterOdometroInicial(veiculoId);
        distancia = odometroAtual - (odometroInicial || 0);
      }

      if (distancia <= 0) {
        return {
          distancia: 0,
          erro: 'A quilometragem atual deve ser maior que a anterior.',
        };
      }

      return { distancia };
    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      return { distancia: 0, erro: 'Erro ao calcular distância' };
    }
  }

  /**
   * Salva um novo abastecimento no banco de dados
   */
  static salvarAbastecimento(dados: {
    veiculoId: number;
    tipoCombustivel: 'ETANOL' | 'GASOLINA';
    odometroAtual: number;
    distanciaPercorrida: number;
    litrosAbastecidos: number;
    precoPorLitro: number;
    tanqueCheio: boolean;
  }): { sucesso: boolean; erro?: string } {
    try {
      if (!dados.veiculoId || !dados.odometroAtual || !dados.litrosAbastecidos) {
        return { sucesso: false, erro: 'Dados obrigatórios não fornecidos' };
      }

      if (dados.distanciaPercorrida <= 0) {
        return {
          sucesso: false,
          erro: 'Distância percorrida deve ser positiva',
        };
      }

      if (dados.litrosAbastecidos <= 0) {
        return { sucesso: false, erro: 'Volume abastecido deve ser positivo' };
      }

      const dataHoje = new Date().toLocaleDateString('pt-BR');
      const tanqueCheioInt = dados.tanqueCheio ? 1 : 0;

      db.runSync(
        `INSERT INTO abastecimentos (
          veiculo_id, tipo_combustivel, odometro_atual, distancia_percorrida, 
          litros_abastecidos, preco_por_litro, data_registro, tanque_cheio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          dados.veiculoId,
          dados.tipoCombustivel,
          dados.odometroAtual,
          dados.distanciaPercorrida,
          dados.litrosAbastecidos,
          dados.precoPorLitro,
          dataHoje,
          tanqueCheioInt,
        ]
      );

      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao salvar abastecimento:', error);
      return { sucesso: false, erro: 'Erro ao salvar abastecimento' };
    }
  }

  /**
   * Carrega todos os abastecimentos com informações do veículo
   */
  static carregarHistoricoCompleto(): AbastecimentoItem[] {
    try {
      const query = `
        SELECT 
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
        ORDER BY a.id DESC;
      `;

      return db.getAllSync<AbastecimentoItem>(query);
    } catch (error) {
      console.error('Erro ao carregar histórico completo:', error);
      return [];
    }
  }

  /**
   * Carrega métricas analíticas por tipo de combustível
   */
  static carregarMetricasAnaliticas(): RelatorioConsumo[] {
    try {
      const query = `
        SELECT 
          tipo_combustivel,
          AVG(distancia_percorrida / litros_abastecidos) as media_km_litro,
          SUM(litros_abastecidos) as total_litros,
          SUM(litros_abastecidos * preco_por_litro) as gasto_total
        FROM abastecimentos
        WHERE tanque_cheio = 1
        GROUP BY tipo_combustivel;
      `;

      return db.getAllSync<RelatorioConsumo>(query);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      return [];
    }
  }

  /**
   * Realiza análise econômica comparando dois combustíveis
   */
  static analisarCombustivel(
    precoEtanol: number,
    precoGasolina: number,
    mediaEtanol: number,
    mediaGasolina: number
  ): {
    melhorOpcao: 'ETANOL' | 'GASOLINA';
    custoEtanol: number;
    custoGasolina: number;
  } {
    const custoEtanol = precoEtanol / mediaEtanol;
    const custoGasolina = precoGasolina / mediaGasolina;

    return {
      melhorOpcao: custoEtanol < custoGasolina ? 'ETANOL' : 'GASOLINA',
      custoEtanol,
      custoGasolina,
    };
  }

  /**
   * Deleta um abastecimento
   */
  static deletar(id: number): { sucesso: boolean; erro?: string } {
    try {
      db.runSync('DELETE FROM abastecimentos WHERE id = ?;', [id]);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao deletar abastecimento:', error);
      return { sucesso: false, erro: 'Erro ao deletar abastecimento' };
    }
  }

  /**
   * Conta o total de abastecimentos
   */
  static contarTotal(): number {
    try {
      const resultado = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM abastecimentos;'
      );
      return resultado?.count || 0;
    } catch (error) {
      console.error('Erro ao contar abastecimentos:', error);
      return 0;
    }
  }
}
