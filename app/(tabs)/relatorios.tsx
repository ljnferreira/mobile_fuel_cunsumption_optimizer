import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from 'expo-router'; // Gancho nativo do Expo Router
import { 
  AbastecimentoService, 
  type RelatorioConsumo, 
  type AbastecimentoItem 
} from '../../src/services/abastecimentoService';
import { VeiculoService, type Veiculo } from '../../src/services/veiculoService';
import UserGreeting from '../../components/UserGreeting';


export default function TelaRelatorios() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState<string>('');
  const [metricas, setMetricas] = useState<RelatorioConsumo[]>([]);
  const [historico, setHistorico] = useState<AbastecimentoItem[]>([]);

  const carregarDadosAnaliticos = (veiculoId: number | null) => {
    const metricas = veiculoId
      ? AbastecimentoService.carregarMetricasAnaliticasPorVeiculo(veiculoId)
      : AbastecimentoService.carregarMetricasAnaliticas();
    setMetricas(metricas);
    
    const historico = veiculoId
      ? AbastecimentoService.carregarHistoricoCompletoPorVeiculo(veiculoId)
      : AbastecimentoService.carregarHistoricoCompleto();
    setHistorico(historico);
  };

  // O useFocusEffect combinado com o useCallback garante o disparo seguro do SQL
  // sempre que o usuário alternar para a aba de relatórios no emulador
  useFocusEffect(
    useCallback(() => {
      const veiculosCarregados = VeiculoService.carregarTodos();
      setVeiculos(veiculosCarregados);
      const idInicial = veiculosCarregados.length > 0 ? veiculosCarregados[0].id : null;
      setVeiculoSelecionadoId(idInicial ? idInicial.toString() : '');
      carregarDadosAnaliticos(idInicial);
    }, [])
  );

  useEffect(() => {
    if (veiculoSelecionadoId) {
      carregarDadosAnaliticos(parseInt(veiculoSelecionadoId, 10));
    }
  }, [veiculoSelecionadoId]);

  const confirmarExclusao = (id: number) => {
    Alert.alert(
      'Excluir abastecimento',
      'Deseja realmente excluir este abastecimento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluirAbastecimento(id) }
      ]
    );
  };

  const excluirAbastecimento = (id: number) => {
    const resultado = AbastecimentoService.deletar(id);
    if (!resultado.sucesso) {
      Alert.alert('Erro', resultado.erro || 'Falha ao excluir o abastecimento.');
      return;
    }

    carregarDadosAnaliticos(veiculoSelecionadoId ? parseInt(veiculoSelecionadoId, 10) : null);
  };

  const obterMetrica = (tipo: 'ETANOL' | 'GASOLINA') => {
    const item = metricas.find(m => m.tipo_combustivel === tipo);
    return {
      media: item?.media_km_litro ? item.media_km_litro.toFixed(2) : '---',
      gasto: item?.gasto_total ? item.gasto_total.toFixed(2) : '0.00',
      litros: item?.total_litros ? item.total_litros.toFixed(1) : '0.0'
    };
  };

  const dadosEtanol = obterMetrica('ETANOL');
  const dadosGasolina = obterMetrica('GASOLINA');

  return (
    <View style={styles.container}>
      <UserGreeting />
      <Text style={styles.cabecalho}>Análise de Dados & Eficiência</Text>

      <View style={styles.secaoFiltro}>
        <Text style={styles.rotuloFiltro}>Selecione o veículo</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={veiculoSelecionadoId}
            onValueChange={(itemValue) => setVeiculoSelecionadoId(itemValue)}
            style={styles.picker}
          >
            {veiculos.map((veiculo) => (
              <Picker.Item key={veiculo.id} label={veiculo.nome} value={veiculo.id.toString()} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Painel Superior de Indicadores */}
      <View style={styles.containerCards}>
        {/* Bloco Etanol */}
        <View style={[styles.cardMetrica, styles.bordaEtanol]}>
          <Text style={[styles.tituloCard, styles.textoEtanol]}>Média Etanol</Text>
          <Text style={styles.valorMedia}>{dadosEtanol.media} <Text style={styles.unit}>km/L</Text></Text>
          <View style={styles.divisor} />
          <Text style={styles.subMetrica}>Volume Total: {dadosEtanol.litros} L</Text>
          <Text style={styles.subMetrica}>Gasto Total: R$ {dadosEtanol.gasto}</Text>
        </View>

        {/* Bloco Gasolina */}
        <View style={[styles.cardMetrica, styles.bordaGasolina]}>
          <Text style={[styles.tituloCard, styles.textoGasolina]}>Média Gasolina</Text>
          <Text style={styles.valorMedia}>{dadosGasolina.media} <Text style={styles.unit}>km/L</Text></Text>
          <View style={styles.divisor} />
          <Text style={styles.subMetrica}>Volume Total: {dadosGasolina.litros} L</Text>
          <Text style={styles.subMetrica}>Gasto Total: R$ {dadosGasolina.gasto}</Text>
        </View>
      </View>

      <Text style={styles.infoNota}>* As médias acima consideram apenas abastecimentos com tanque cheio.</Text>

      {/* Histórico de Transações */}
      <Text style={styles.tituloLista}>Histórico de Abastecimentos</Text>

      <FlatList
        data={historico}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardHistorico}>
            <View style={styles.linhaPrincipal}>
              <View>
                <Text style={styles.carroNome}>{item.carro_nome}</Text>
                <Text style={styles.dataText}>{item.data_registro}</Text>
              </View>
              
              <View style={styles.containerBadges}>
                <View style={[
                  styles.badge, 
                  item.tipo_combustivel === 'ETANOL' ? styles.badgeEtanol : styles.badgeGasolina
                ]}>
                  <Text style={styles.textoBadge}>{item.tipo_combustivel}</Text>
                </View>
                
                <View style={[
                  styles.badge, 
                  item.tanque_cheio === 1 ? styles.badgeCheio : styles.badgeParcial
                ]}>
                  <Text style={styles.textoBadgeNat}>
                    {item.tanque_cheio === 1 ? 'TANQUE CHEIO' : 'PARCIAL'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.linhaDetalhes}>
              <Text style={styles.detalheText}>Distância: <Text style={styles.bold}>{item.distancia_percorrida} km</Text></Text>
              <Text style={styles.detalheText}>Volume: <Text style={styles.bold}>{item.litros_abastecidos} L</Text></Text>
              <Text style={styles.precoText}>R$ {item.preco_por_litro.toFixed(2)}/L</Text>
            </View>
            
            <View style={styles.linhaRodape}>
              <View>
                <Text style={styles.custoTotalItem}>
                  Total Pago: R$ {(item.litros_abastecidos * item.preco_por_litro).toFixed(2)}
                </Text>
                {item.tanque_cheio === 1 && (
                  <Text style={styles.consumoRealItem}>
                    Rendimento: {(item.distancia_percorrida / item.litros_abastecidos).toFixed(2)} km/L
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.botaoExcluir} onPress={() => confirmarExclusao(item.id)}>
                <Text style={styles.textoBotaoExcluir}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.containerVazio}>
            <Text style={styles.textoVazio}>Nenhum registro no banco local.</Text>
            <Text style={styles.subtextoVazio}>Abasteça um veículo na aba principal inserindo a quilometragem para gerar os registros analíticos aqui.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 20, paddingTop: 40 },
  cabecalho: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 20 },
  containerCards: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardMetrica: { width: '48%', backgroundColor: '#fff', padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#e5e5ea' },
  bordaEtanol: { borderLeftWidth: 5, borderLeftColor: '#34c759' },
  bordaGasolina: { borderLeftWidth: 5, borderLeftColor: '#ffcc00' },
  tituloCard: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  textoEtanol: { color: '#34c759' },
  textoGasolina: { color: '#ba9400' },
  valorMedia: { fontSize: 24, fontWeight: 'bold', color: '#1c1c1e' },
  unit: { fontSize: 13, fontWeight: 'normal', color: '#8e8e93' },
  divisor: { height: 1, backgroundColor: '#f2f2f7', marginVertical: 8 },
  subMetrica: { fontSize: 11, color: '#3a3a3c', marginTop: 2 },
  infoNota: { fontSize: 11, color: '#8e8e93', fontStyle: 'italic', marginBottom: 25 },
  secaoFiltro: { marginBottom: 18 },
  rotuloFiltro: { fontSize: 14, fontWeight: '600', color: '#3a3a3c', marginBottom: 8 },
  pickerContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 10, overflow: 'hidden' },
  picker: { height: 50, width: '100%', color: '#1c1c1e' },
  tituloLista: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 12 },
  cardHistorico: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  linhaPrincipal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  carroNome: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e' },
  containerBadges: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4, alignItems: 'center' },
  badgeEtanol: { backgroundColor: '#e2f7e7' },
  badgeGasolina: { backgroundColor: '#fff9db' },
  badgeCheio: { backgroundColor: '#007aff' },
  badgeParcial: { backgroundColor: '#8e8e93' },
  textoBadge: { fontSize: 9, fontWeight: 'bold', color: '#1c1c1e' },
  textoBadgeNat: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  linhaDetalhes: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, backgroundColor: '#fafafa', padding: 8, borderRadius: 6 },
  detalheText: { fontSize: 13, color: '#3a3a3c' },
  bold: { fontWeight: 'bold' },
  precoText: { fontSize: 13, fontWeight: '600', color: '#1c1c1e' },
  linhaRodape: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f2f2f7', paddingTop: 8, marginTop: 4 },
  dataText: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
  custoTotalItem: { fontSize: 13, fontWeight: 'bold', color: '#1c1c1e' },
  consumoRealItem: { fontSize: 13, fontWeight: 'bold', color: '#34c759' },
  botaoExcluir: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ff3b30', borderRadius: 8, alignSelf: 'flex-start' },
  textoBotaoExcluir: { color: '#fff', fontSize: 12, fontWeight: '700' },
  containerVazio: { padding: 30, alignItems: 'center' },
  textoVazio: { fontSize: 16, fontWeight: 'bold', color: '#8e8e93' },
  subtextoVazio: { fontSize: 13, color: '#8e8e93', textAlign: 'center', marginTop: 6, lineHeight: 18 }
});