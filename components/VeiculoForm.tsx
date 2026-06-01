import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard } from 'react-native';

type VeiculoFormProps = {
  title?: string;
  submitLabel: string;
  onSubmit: (nome: string, capacidade: number, odometro: number, combustivel: 'ETANOL' | 'GASOLINA') => boolean;
  showFuelSelector?: boolean;
};

export default function VeiculoForm({ title, submitLabel, onSubmit, showFuelSelector = true }: VeiculoFormProps) {
  const [nome, setNome] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [odometro, setOdometro] = useState('');
  const [combustivel, setCombustivel] = useState<'ETANOL' | 'GASOLINA'>('GASOLINA');

  const handleSubmit = () => {
    if (!nome.trim() || !capacidade || !odometro) {
      Alert.alert('Atenção', 'Preencha todos os campos para cadastrar o veículo.');
      return;
    }

    const capTanque = parseFloat(capacidade);
    const odomInicial = parseFloat(odometro);

    if (isNaN(capTanque) || capTanque <= 0) {
      Alert.alert('Atenção', 'Informe uma capacidade de tanque válida.');
      return;
    }

    if (isNaN(odomInicial) || odomInicial < 0) {
      Alert.alert('Atenção', 'Informe um odômetro inicial válido.');
      return;
    }

    const sucesso = onSubmit(nome.trim(), capTanque, odomInicial, combustivel);
    if (sucesso) {
      setNome('');
      setCapacidade('');
      setOdometro('');
      setCombustivel('GASOLINA');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.cardFormulario}>
      {title ? <Text style={styles.subtitulo}>{title}</Text> : null}

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

      {showFuelSelector && (
        <>
          <Text style={styles.label}>Combustível atual no tanque:</Text>
          <View style={styles.rowBotoesCombustivel}>
            <TouchableOpacity 
              style={[styles.botaoCombustivel, combustivel === 'ETANOL' && styles.ativoEtanol]} 
              onPress={() => setCombustivel('ETANOL')}
            >
              <Text style={styles.textoBotaoCombustivel}>ETANOL</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.botaoCombustivel, combustivel === 'GASOLINA' && styles.ativoGasolina]} 
              onPress={() => setCombustivel('GASOLINA')}
            >
              <Text style={styles.textoBotaoCombustivel}>GASOLINA</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.botao} onPress={handleSubmit}>
        <Text style={styles.textoBotao}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardFormulario: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 25,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a3a3c',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3a3a3c',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginBottom: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputMetade: {
    width: '48%',
  },
  rowBotoesCombustivel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  botaoCombustivel: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  ativoEtanol: {
    backgroundColor: '#e2f7e7',
    borderColor: '#34c759',
  },
  ativoGasolina: {
    backgroundColor: '#fff9db',
    borderColor: '#ba9400',
  },
  textoBotaoCombustivel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  botao: {
    backgroundColor: '#007aff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
