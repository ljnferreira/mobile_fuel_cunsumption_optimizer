import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  Keyboard
} from 'react-native';
import { db } from '../../src/database/database';

interface Veiculo {
  id: number;
  nome: string;
  capacidade_tanque: number;
  odometro_inicial: number;
}

export default function TelaVeiculos() {
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [odometro, setOdometro] = useState('');
  
  // Estado da lista
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  // Carregar veículos do banco local assim que a tela abrir
  const carregarVeiculos = () => {
    try {
      const resultados = db.getAllSync<Veiculo>('SELECT * FROM veiculos ORDER BY id DESC;');
      setVeiculos(resultados);
    } catch (error) {
      console.error("Erro ao buscar veículos:", error);
    }
  };

  useEffect(() => {
    carregarVeiculos();
  }, []);

  // Adicionar novo veículo no SQLite
  const cadastrarVeiculo = () => {
    if (!nome.trim() || !capacidade || !odometro) {
      Alert.alert("Atenção", "Preencha todos os campos para cadastrar o veículo.");
      return;
    }

    const capTanque = parseFloat(capacidade);
    const odomInicial = parseFloat(odometro);

    try {
      db.runSync(
        'INSERT INTO veiculos (nome, capacidade_tanque, odometro_inicial) VALUES (?, ?, ?);',
        [nome, capTanque, odomInicial]
      );

      Alert.alert("Sucesso", `${nome} cadastrado com sucesso!`);
      
      // Limpar campos e fechar teclado
      setNome('');
      setCapacidade('');
      setOdometro('');
      Keyboard.dismiss();
      
      // Atualizar a lista local
      carregarVeiculos();
    } catch (error) {
      console.error("Erro ao inserir veículo:", error);
      Alert.alert("Erro", "Não foi possível salvar o veículo no banco offline.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.cabecalho}>Garagem Virtual (1 a N Carros)</Text>
      
      {/* Formulário de Cadastro */}
      <View style={styles.cardFormulario}>
        <Text style={styles.subtitulo}>Cadastrar Novo Veículo Flex</Text>
        
        <TextInput 
          placeholder="Ex: Fiat Idea, Honda City, Cobalt..." 
          value={nome} 
          onChangeText={setNome} 
          style={styles.input} 
        />
        
        <View style={styles.row}>
          <TextInput 
            placeholder="Capacidade Tanque (L)" 
            keyboardType="numeric" 
            value={capacidade} 
            onChangeText={setCapacidade} 
            style={[styles.input, styles.inputMetade]} 
          />
          <TextInput 
            placeholder="Odômetro Atual (KM)" 
            keyboardType="numeric" 
            value={odometro} 
            onChangeText={setOdometro} 
            style={[styles.input, styles.inputMetade]} 
          />
        </View>

        <TouchableOpacity style={styles.botao} onPress={cadastrarVeiculo}>
          <Text style={styles.textoBotao}>Salvar Veículo Offline</Text>
        </TouchableOpacity>
      </View>

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
            <View style={styles.badgeFlex}>
              <Text style={styles.textoBadge}>FLEX</Text>
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
  badgeFlex: { backgroundColor: '#34c759', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  textoBadge: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  listaVazia: { textAlign: 'center', color: '#8e8e93', marginTop: 20, fontSize: 14 }
});