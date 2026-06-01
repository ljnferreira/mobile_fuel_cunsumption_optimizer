import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard } from 'react-native';

type VeiculoFormProps = {
  title?: string;
  submitLabel: string;
  onSubmit: (nome: string, capacidade: number, odometro: number) => boolean;
};

export default function VeiculoForm({ title, submitLabel, onSubmit }: VeiculoFormProps) {
  const [nome, setNome] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [odometro, setOdometro] = useState('');

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

    const sucesso = onSubmit(nome.trim(), capTanque, odomInicial);
    if (sucesso) {
      setNome('');
      setCapacidade('');
      setOdometro('');
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
