import type { Abastecimento, MediaConsumo, RelatorioConsumo, AbastecimentoItem } from '../models';
import { AbastecimentoRepository } from '../repositories/AbastecimentoRepository';
import { VeiculoRepository } from '../repositories/VeiculoRepository';
import { predizerConsumoKmL } from '../domain/inteligencia';
export type { Abastecimento, MediaConsumo, RelatorioConsumo, AbastecimentoItem } from '../models';

export class AbastecimentoService {
  /**
   * Carrega todas as médias de consumo para um veículo específico
   * Utiliza apenas abastecimentos com tanque cheio para precisão
   */
  static carregarMediasConsumoPorVeiculo(
    veiculoId: number
  ): Map<'ETANOL' | 'GASOLINA', number> {
    const medias = AbastecimentoRepository.findMediasConsumoPorVeiculo(veiculoId);
    const mapaMedias = new Map<'ETANOL' | 'GASOLINA', number>();

    medias.forEach((item) => {
      if (item.tipo_combustivel === 'ETANOL' || item.tipo_combustivel === 'GASOLINA') {
        mapaMedias.set(item.tipo_combustivel as 'ETANOL' | 'GASOLINA', item.media);
      }
    });

    return mapaMedias;
  }

  /**
   * Carrega o histórico de abastecimentos para cálculo de previsão (IA)
   */
  static carregarHistoricoPariaPrevisao(
    veiculoId: number,
    tipoCombustivel: 'ETANOL' | 'GASOLINA'
  ): Array<{ distanciaPercorrida: number; litrosAbastecidos: number }> {
    const historico = AbastecimentoRepository.findHistoricoParaPrevisao(
      veiculoId,
      tipoCombustivel
    );

    return historico.map((h) => ({
      distanciaPercorrida: h.distancia_percorrida,
      litrosAbastecidos: h.litros_abastecidos,
    }));
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
    const histEtanol = this.carregarHistoricoPariaPrevisao(veiculoId, 'ETANOL');
    const histGasolina = this.carregarHistoricoPariaPrevisao(veiculoId, 'GASOLINA');

    const predicaoEtanol = predizerConsumoKmL(histEtanol);
    const predicaoGasolina = predizerConsumoKmL(histGasolina);

    const mediasHistoricas = this.carregarMediasConsumoPorVeiculo(veiculoId);
    const mediaEtanolBase = mediasHistoricas.get('ETANOL') ?? 7.5;
    const mediaGasolinaBase = mediasHistoricas.get('GASOLINA') ?? 10.5;

    const ativeIA = predicaoEtanol > 0 && predicaoGasolina > 0;

    return {
      etanol: ativeIA ? predicaoEtanol : mediaEtanolBase,
      gasolina: ativeIA ? predicaoGasolina : mediaGasolinaBase,
      ativeIA,
    };
  }

  /**
   * Obtém o último odômetro registrado para um veículo
   */
  static obterUltimoOdometro(veiculoId: number): number | null {
    const resultado = AbastecimentoRepository.findUltimoAbastecimentoPorVeiculo(veiculoId);
    return resultado?.odometro_atual || null;
  }

  /**
   * Calcula a distância percorrida entre dois pontos
   */
  static calcularDistancia(
    veiculoId: number,
    odometroAtual: number
  ): { distancia: number; erro?: string } {
    const ultimoOdometro = this.obterUltimoOdometro(veiculoId);

    let distancia = 0;

    if (ultimoOdometro !== null) {
      distancia = odometroAtual - ultimoOdometro;
    } else {
      const veiculo = VeiculoRepository.findById(veiculoId);
      if (!veiculo) {
        return { distancia: 0, erro: 'Veículo não encontrado.' };
      }

      distancia = odometroAtual - veiculo.odometro_inicial;
    }

    if (distancia <= 0) {
      return {
        distancia: 0,
        erro: 'A quilometragem atual deve ser maior que a anterior.',
      };
    }

    return { distancia };
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

    // Verificar se há mudança de combustível
    const ultimoAbastecimento = AbastecimentoRepository.findUltimoAbastecimentoPorVeiculo(dados.veiculoId);
    if (ultimoAbastecimento && ultimoAbastecimento.tipo_combustivel !== dados.tipoCombustivel) {
      // Atualizar o combustível_atual do veículo
      VeiculoRepository.updateCombustivelAtual(dados.veiculoId, dados.tipoCombustivel);
    }

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const tanqueCheioInt = dados.tanqueCheio ? 1 : 0;

    const sucesso = AbastecimentoRepository.insert({
      veiculo_id: dados.veiculoId,
      tipo_combustivel: dados.tipoCombustivel,
      odometro_atual: dados.odometroAtual,
      distancia_percorrida: dados.distanciaPercorrida,
      litros_abastecidos: dados.litrosAbastecidos,
      preco_por_litro: dados.precoPorLitro,
      data_registro: dataHoje,
      tanque_cheio: tanqueCheioInt,
    });

    if (!sucesso) {
      return { sucesso: false, erro: 'Erro ao salvar abastecimento' };
    }

    return { sucesso: true };
  }

  /**
   * Carrega todos os abastecimentos com informações do veículo
   */
  static carregarHistoricoCompleto(): AbastecimentoItem[] {
    return AbastecimentoRepository.findHistoricoCompleto();
  }

  static carregarHistoricoCompletoPorVeiculo(veiculoId: number): AbastecimentoItem[] {
    return AbastecimentoRepository.findHistoricoCompletoPorVeiculo(veiculoId);
  }

  /**
   * Carrega métricas analíticas por tipo de combustível
   */
  static carregarMetricasAnaliticas(): RelatorioConsumo[] {
    return AbastecimentoRepository.findMetricasAnaliticas();
  }

  static carregarMetricasAnaliticasPorVeiculo(veiculoId: number): RelatorioConsumo[] {
    return AbastecimentoRepository.findMetricasAnaliticasPorVeiculo(veiculoId);
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
    const sucesso = AbastecimentoRepository.delete(id);
    if (!sucesso) {
      return { sucesso: false, erro: 'Erro ao deletar abastecimento' };
    }
    return { sucesso: true };
  }

  /**
   * Conta o total de abastecimentos
   */
  static contarTotal(): number {
    return AbastecimentoRepository.count();
  }
}
