import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { VeiculoService, type Veiculo } from '../../src/services/veiculoService';
import VeiculoForm from '../../components/VeiculoForm';
import UserGreeting from '../../components/UserGreeting';


export default function TelaVeiculos() {
  // Estado da lista
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  // Carregar veículos do banco local assim que a tela abrir
  const carregarVeiculos = () => {
    const veiculosCarregados = VeiculoService.carregarTodos();
    setVeiculos(veiculosCarregados);
  };

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const cadastrarVeiculo = (nome: string, capacidade: number, odometro: number, combustivel: 'ETANOL' | 'GASOLINA'): boolean => {
    const resultado = VeiculoService.cadastrar(nome, capacidade, odometro, combustivel);

    if (!resultado.sucesso) {
      Alert.alert('Erro', resultado.erro || 'Não foi possível salvar o veículo no banco offline.');
      return false;
    }

    Alert.alert('Sucesso', `${nome} cadastrado com sucesso!`);
    carregarVeiculos();
    return true;
  };

  const confirmarExclusao = (id: number, nome: string) => {
    Alert.alert(
      'Excluir veículo',
      `Deseja excluir ${nome} e todo o seu histórico? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluirVeiculo(id) }
      ]
    );
  };

  const excluirVeiculo = (id: number) => {
    const resultado = VeiculoService.deletar(id);
    if (!resultado.sucesso) {
      Alert.alert('Erro', resultado.erro || 'Não foi possível excluir o veículo.');
      return;
    }

    Alert.alert('Sucesso', 'Veículo e histórico excluídos com sucesso.');
    carregarVeiculos();
  };

  return (
    <View style={styles.container}>
      <UserGreeting />
      <Text style={styles.cabecalho}>Garagem Virtual (1 a N Carros)</Text>
      
      {/* Formulário de Cadastro */}
      <VeiculoForm
        title="Cadastrar Novo Veículo Flex"
        submitLabel="Salvar Veículo Offline"
        onSubmit={cadastrarVeiculo}
      />

      {/* Lista de Veículos Cadastrados */}
      <Text style={styles.tituloLista}>Seus Veículos Cadastrados</Text>
      
      <FlatList
        data={veiculos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardVeiculo}>
            <View>
              <Text style={styles.nomeVeiculo}>{item.nome}</Text>
              <Text style={styles.detalheVeiculo}>Tanque: {item.capacidade_tanque}L | Km Inicial: {item.odometro_inicial} km</Text>
            </View>
            <View style={styles.actionsContainer}>
              <View style={styles.badgeFlex}>
                <Text style={styles.textoBadge}>FLEX</Text>
              </View>
              {veiculos.length > 1 && (
                <TouchableOpacity style={styles.botaoExcluir} onPress={() => confirmarExclusao(item.id, item.nome)}>
                  <Text style={styles.textoExcluir}>Excluir</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.listaVazia}>Nenhum veículo cadastrado. Insira o primeiro acima!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 20, paddingTop: 40 },
  cabecalho: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 20 },
  cardFormulario: { backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 25 },
  subtitulo: { fontSize: 16, fontWeight: '600', color: '#3a3a3c', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e5ea', padding: 12, borderRadius: 8, backgroundColor: '#fafafa', marginBottom: 12, fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputMetade: { width: '48%' },
  botao: { backgroundColor: '#007aff', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tituloLista: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 12 },
  cardVeiculo: { backgroundColor: '#fff', padding: 16, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  nomeVeiculo: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e' },
  detalheVeiculo: { fontSize: 13, color: '#8e8e93', marginTop: 4 },
  actionsContainer: { alignItems: 'flex-end' },
  badgeFlex: { backgroundColor: '#34c759', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  textoBadge: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  botaoExcluir: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ff3b30', borderRadius: 8 },
  textoExcluir: { color: '#fff', fontWeight: '700', fontSize: 12 },
  listaVazia: { textAlign: 'center', color: '#8e8e93', marginTop: 20, fontSize: 14 }
});