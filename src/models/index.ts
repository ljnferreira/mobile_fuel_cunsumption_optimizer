export interface Usuario {
  id: number;
  nome: string;
}

export interface Veiculo {
  id: number;
  nome: string;
  capacidade_tanque: number;
  odometro_inicial: number;
  combustivel_atual: 'ETANOL' | 'GASOLINA';
}

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
