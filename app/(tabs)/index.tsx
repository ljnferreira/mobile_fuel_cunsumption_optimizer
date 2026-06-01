import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Keyboard,
  Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { VeiculoService, type Veiculo } from '../../src/services/veiculoService';
import { AbastecimentoService } from '../../src/services/abastecimentoService';


export default function TelaBomba() {
  // Estados de inputs da bomba
  const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState<string>('');
  const [precoEtanol, setPrecoEtanol] = useState('');
  const [precoGasolina, setPrecoGasolina] = useState('');
  const [odometroAtual, setOdometroAtual] = useState('');
  const [litrosAbastecidos, setLitrosAbastecidos] = useState('');
  const [combustivelAbastecido, setCombustivelAbastecido] = useState<'ETANOL' | 'GASOLINA'>('GASOLINA');
  const [isTanqueCheio, setIsTanqueCheio] = useState(true); // Padrão: Tanque Cheio

  // Estados das médias (Preenchidos automaticamente pela IA ou manualmente)
  const [mediaEtanol, setMediaEtanol] = useState('7.5');
  const [mediaGasolina, setMediaGasolina] = useState('10.5');

  // Estados de controle e resultado
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [resultadoDecisao, setResultadoDecisao] = useState('');
  const [usandoIA, setUsandoIA] = useState(false);

  // Carrega a lista de veículos
  const carregarVeiculos = () => {
    const dados = VeiculoService.carregarTodos();
    setVeiculos(dados);
    if (dados.length > 0) {
      setVeiculoSelecionadoId(dados[0].id.toString());
    }
  };

  useEffect(() => {
    carregarVeiculos();
  }, []);

  // FUNÇÃO CHAVE: Roda a IA e preenche o consumo automaticamente ao trocar de carro
  const calcularConsumoAutomatico = (carroId: string) => {
    if (!carroId) return;

    const idVeiculo = parseInt(carroId, 10);
    
    // Obtém consumo otimizado da IA
    const consumoOtimizado = AbastecimentoService.calcularConsumoOtimizadoPorIA(idVeiculo);
    
    setMediaEtanol(consumoOtimizado.etanol.toFixed(2));
    setMediaGasolina(consumoOtimizado.gasolina.toFixed(2));
    setUsandoIA(consumoOtimizado.ativeIA);
  };

  // Dispara o cálculo automático toda vez que o ID do veículo selecionado mudar
  useEffect(() => {
    if (veiculoSelecionadoId) {
      calcularConsumoAutomatico(veiculoSelecionadoId);
    }
  }, [veiculoSelecionadoId]);

  // Tomada de decisão econômica baseada no que está na tela
  const analisarCombustivel = () => {
    if (!precoEtanol || !precoGasolina) {
      Alert.alert("Atenção", "Insira os preços de ambos os combustíveis para analisar.");
      return;
    }

    const analise = AbastecimentoService.analisarCombustivel(
      parseFloat(precoEtanol),
      parseFloat(precoGasolina),
      parseFloat(mediaEtanol),
      parseFloat(mediaGasolina)
    );

    if (analise.melhorOpcao === 'ETANOL') {
      setResultadoDecisao(`Abasteça com ETANOL!\nCusto previsto: R$ ${analise.custoEtanol.toFixed(2)}/km\nMédia aplicada: ${parseFloat(mediaEtanol).toFixed(1)} km/L.`);
    } else {
      setResultadoDecisao(`Abasteça com GASOLINA!\nCusto previsto: R$ ${analise.custoGasolina.toFixed(2)}/km\nMédia aplicada: ${parseFloat(mediaGasolina).toFixed(1)} km/L.`);
    }
    Keyboard.dismiss();
  };

  // Salva o novo ponto na base de dados
  const salvarAbastecimento = () => {
    if (!veiculoSelecionadoId || !odometroAtual || !litrosAbastecidos) {
      Alert.alert("Atenção", "Preencha todos os campos do abastecimento corrente.");
      return;
    }

    const idVeiculo = parseInt(veiculoSelecionadoId);
    const kmAtual = parseFloat(odometroAtual);
    const litros = parseFloat(litrosAbastecidos);
    const preco = parseFloat(combustivelAbastecido === 'ETANOL' ? precoEtanol : precoGasolina);

    if (!preco) {
      Alert.alert("Erro", "Digite o preço do combustível escolhido no bloco superior.");
      return;
    }

    // Calcula a distância percorrida
    const resultDistancia = AbastecimentoService.calcularDistancia(idVeiculo, kmAtual);
    
    if (resultDistancia.erro) {
      Alert.alert("Erro de Consistência", resultDistancia.erro);
      return;
    }

    // Salva o abastecimento
    const resultado = AbastecimentoService.salvarAbastecimento({
      veiculoId: idVeiculo,
      tipoCombustivel: combustivelAbastecido,
      odometroAtual: kmAtual,
      distanciaPercorrida: resultDistancia.distancia,
      litrosAbastecidos: litros,
      precoPorLitro: preco,
      tanqueCheio: isTanqueCheio,
    });
    
    if (!resultado.sucesso) {
      Alert.alert("Erro", resultado.erro || "Falha ao persistir dados.");
      return;
    }

      Alert.alert("Sucesso", "Abastecimento salvo com sucesso!");
      setOdometroAtual('');
      setLitrosAbastecidos('');
      
      // Força a atualização das médias imediatamente após salvar o novo ponto
      calcularConsumoAutomatico(veiculoSelecionadoId);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Posto Digital - Tomada de Decisão</Text>

      {/* Seletor do Veículo Corrente */}
      <View style={styles.secao}>
        <Text style={styles.rotulo}>Selecione seu Veículo:</Text>
        <View style={styles.pickerContainer}>
          {veiculos.length > 0 ? (
            <Picker
              selectedValue={veiculoSelecionadoId}
              onValueChange={(itemValue) => setVeiculoSelecionadoId(itemValue)}
              style={styles.picker}
            >
              {veiculos.map(v => <Picker.Item key={v.id} label={v.nome} value={v.id.toString()} />)}
            </Picker>
          ) : (
            <Text style={styles.avisoNenhumCarro}>Nenhum carro na garagem. Vá na aba veículos!</Text>
          )}
        </View>
      </View>

      {/* Painel de Preços da Bomba */}
      <View style={styles.rowInputs}>
        <View style={styles.blocoInput}>
          <Text style={styles.rotulo}>Preço Etanol (R$):</Text>
          <TextInput placeholder="0.00" keyboardType="numeric" value={precoEtanol} onChangeText={setPrecoEtanol} style={styles.input} />
        </View>
        <View style={styles.blocoInput}>
          <Text style={styles.rotulo}>Preço Gasolina (R$):</Text>
          <TextInput placeholder="0.00" keyboardType="numeric" value={precoGasolina} onChangeText={setPrecoGasolina} style={styles.input} />
        </View>
      </View>

      {/* Consumo Predict/Manual - Sempre visível, mas sinaliza visualmente se veio da IA */}
      <View style={[styles.cardFeedback, usandoIA ? styles.bgIA : styles.bgNormal]}>
        <Text style={styles.tituloFeedback}>
          {usandoIA ? "🤖 Consumo Otimizado por Regressão Linear" : "📊 Consumo Estimado (Sem histórico de IA)"}
        </Text>
        <View style={styles.rowInputs}>
          <View style={{ width: '48%' }}>
            <Text style={styles.miniLabel}>Média Etanol (km/L):</Text>
            <TextInput keyboardType="numeric" value={mediaEtanol} onChangeText={setMediaEtanol} style={styles.input} editable={!usandoIA} />
          </View>
          <View style={{ width: '48%' }}>
            <Text style={styles.miniLabel}>Média Gasolina (km/L):</Text>
            <TextInput keyboardType="numeric" value={mediaGasolina} onChangeText={setMediaGasolina} style={styles.input} editable={!usandoIA} />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.botaoPrincipal} onPress={analisarCombustivel}>
        <Text style={styles.textoBotao}>Calcular Melhor Opção</Text>
      </TouchableOpacity>

      {/* Painel do Resultado Preditivo */}
      {resultadoDecisao ? (
        <View style={[styles.cardResultado, usandoIA ? styles.bordaIA : styles.bordaNormal]}>
          <Text style={styles.labelResultado}>RESULTADO DA ANÁLISE:</Text>
          <Text style={styles.textoResultado}>{resultadoDecisao}</Text>
        </View>
      ) : null}

      <View style={styles.divisorSeccao} />

      {/* Painel de Registro de Abastecimento */}
      <View style={styles.secaoAbastecimento}>
        <Text style={styles.subtitulo}>Confirmou o abastecimento? Registre:</Text>
        
        <View style={styles.rowBotoesCombustivel}>
          <TouchableOpacity 
            style={[styles.botaoCombustivel, combustivelAbastecido === 'ETANOL' && styles.ativoEtanol]} 
            onPress={() => setCombustivelAbastecido('ETANOL')}
          >
            <Text style={styles.textoBotaoCombustivel}>ETANOL</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.botaoCombustivel, combustivelAbastecido === 'GASOLINA' && styles.ativoGasolina]} 
            onPress={() => setCombustivelAbastecido('GASOLINA')}
          >
            <Text style={styles.textoBotaoCombustivel}>GASOLINA</Text>
          </TouchableOpacity>
        </View>

        <TextInput placeholder="KM atual do Painel" keyboardType="numeric" value={odometroAtual} onChangeText={setOdometroAtual} style={[styles.input, { marginBottom: 12 }]} />
        <TextInput placeholder="Quantos litros colocou?" keyboardType="numeric" value={litrosAbastecidos} onChangeText={setLitrosAbastecidos} style={[styles.input, { marginBottom: 12 }]} />

        {/* Chave de Auditoria: Tanque Cheio */}
        <View style={styles.rowSwitch}>
          <Text style={styles.rotuloSwitch}>Completou o tanque (Tanque Cheio)?</Text>
          <Switch value={isTanqueCheio} onValueChange={setIsTanqueCheio} trackColor={{ false: '#767577', true: '#34c759' }} />
        </View>
        <Text style={styles.legendaSwitch}>*Abastecimentos parciais não serão usados para treinar o modelo preditivo da IA, mantendo os dados precisos.</Text>

        <TouchableOpacity style={[styles.botaoPrincipal, { backgroundColor: '#34c759', marginTop: 15 }]} onPress={salvarAbastecimento}>
          <Text style={styles.textoBotao}>Confirmar e Alimentar IA</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40, backgroundColor: '#f5f5f7' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 20, textAlign: 'center' },
  secao: { marginBottom: 15 },
  rotulo: { fontSize: 14, fontWeight: '600', color: '#3a3a3c', marginBottom: 6 },
  pickerContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 8, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  avisoNenhumCarro: { padding: 15, color: '#8e8e93', fontSize: 13 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  blocoInput: { width: '48%', marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 8, padding: 12, fontSize: 16, color: '#1c1c1e' },
  botaoPrincipal: { backgroundColor: '#007aff', padding: 15, borderRadius: 10, alignItems: 'center', marginVertical: 10 },
  textoBotao: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardResultado: { padding: 16, borderRadius: 10, backgroundColor: '#fff', marginTop: 10, elevation: 2 },
  bordaNormal: { borderLeftWidth: 5, borderLeftColor: '#007aff' },
  bordaIA: { borderLeftWidth: 5, borderLeftColor: '#5856d6', backgroundColor: '#f3f2ff' },
  labelResultado: { fontSize: 11, fontWeight: 'bold', color: '#8e8e93', marginBottom: 4 },
  textoResultado: { fontSize: 15, fontWeight: 'bold', color: '#1c1c1e' },
  divisorSeccao: { height: 1, backgroundColor: '#d1d1d6', marginVertical: 25 },
  secaoAbastecimento: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5ea' },
  subtitulo: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 12 },
  rowBotoesCombustivel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  botaoCombustivel: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#e5e5ea', alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
  textoBotaoCombustivel: { fontWeight: 'bold', color: '#3a3a3c' },
  ativoEtanol: { backgroundColor: '#e2f7e7', borderColor: '#34c759' },
  ativoGasolina: { backgroundColor: '#fff9db', borderColor: '#ffcc00' },
  cardFeedback: { padding: 14, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  bgNormal: { backgroundColor: '#e5e5ea', borderColor: '#d1d1d6' },
  bgIA: { backgroundColor: '#f3f2ff', borderColor: '#d3cfff' },
  tituloFeedback: { fontSize: 13, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 10 },
  miniLabel: { fontSize: 11, color: '#48484a', marginBottom: 4, fontWeight: '500' },
  rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  rotuloSwitch: { fontSize: 14, color: '#1c1c1e', fontWeight: '500' },
  legendaSwitch: { fontSize: 11, color: '#8e8e93', marginTop: 6, lineHeight: 15 }
});