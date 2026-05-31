// Importação tratada para compatibilidade total com o Metro Bundler do Expo
import * as MLRegression from 'ml-regression-simple-linear';

// Garante o mapeamento do construtor independente de como o Metro resolva o módulo
const SimpleLinearRegression = (MLRegression as any).default || (MLRegression as any).SimpleLinearRegression || MLRegression;

interface PontoAbastecimento {
  distanciaPercorrida: number;
  litrosAbastecidos: number;
}

/**
 * Calcula a previsão de consumo (km/L) utilizando o algoritmo de Regressão Linear.
 * * @param historico Array contendo os pontos de coordenadas (X: distância, Y: litros)
 * @returns Média preditiva em km/L ou 0 caso não haja dados suficientes.
 */
export function predizerConsumoKmL(historico: PontoAbastecimento[]): number {
  // O algoritmo de regressão linear exige no mínimo 2 pontos (coordenadas) para traçar uma reta
  if (!historico || historico.length < 2) {
    return 0; 
  }

  // Separa as variáveis independentes (X) e dependentes (Y)
  const x = historico.map(h => h.distanciaPercorrida);
  const y = historico.map(h => h.litrosAbastecidos);

  try {
    // Instancia e treina o modelo preditivo instantaneamente (Offline)
    const regression = new SimpleLinearRegression(x, y);
    
    // O coeficiente angular (slope) representa o consumo em L/km (Litros por Quilômetro).
    // Para retornar no padrão brasileiro (km/L), precisamos calcular o inverso (1 / slope).
    if (!regression.slope || regression.slope === 0) {
      return 0;
    }
    
    const kmLPrevisao = 1 / regression.slope;
    
    // Retorna o valor formatado com duas casas decimais
    return parseFloat(kmLPrevisao.toFixed(2));
  } catch (error) {
    console.error("Erro interno no motor de IA (Regressão Linear):", error);
    return 0;
  }
}