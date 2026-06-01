import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { VeiculoService } from '../src/services/veiculoService';
import { UsuarioService } from '../src/services/usuarioService';
import VeiculoForm from '../components/VeiculoForm';

export default function TelaOnboarding() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState('');

  useEffect(() => {
    const totalVeiculos = VeiculoService.contarTotal();
    if (totalVeiculos > 0) {
      router.replace('(tabs)');
      return;
    }

    setCarregando(false);
  }, [router]);

  const cadastrarPrimeiroVeiculo = (nome: string, capacidade: number, odometro: number, combustivel: 'ETANOL' | 'GASOLINA'): boolean => {
    if (!nomeUsuario.trim()) {
      Alert.alert('Atenção', 'Informe seu nome ou apelido antes de cadastrar o primeiro veículo.');
      return false;
    }

    const resultadoUsuario = UsuarioService.cadastrar(nomeUsuario.trim());
    if (!resultadoUsuario.sucesso) {
      Alert.alert('Erro', resultadoUsuario.erro || 'Não foi possível salvar o nome do usuário.');
      return false;
    }

    const resultadoVeiculo = VeiculoService.cadastrar(nome, capacidade, odometro, combustivel);
    if (!resultadoVeiculo.sucesso) {
      Alert.alert('Erro', resultadoVeiculo.erro || 'Não foi possível salvar o veículo.');
      return false;
    }

    router.replace('(tabs)');
    return true;
  };

  if (carregando) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Bem-vindo ao Posto Digital</Text>
      <Text style={styles.subtitulo}>
        Cadastre seu nome ou apelido e o primeiro veículo para começar a usar o aplicativo.
      </Text>

      <Text style={styles.label}>Nome ou apelido</Text>
      <TextInput
        placeholder="Ex: João, Ju, Família Silva"
        value={nomeUsuario}
        onChangeText={setNomeUsuario}
        style={styles.input}
      />

      <VeiculoForm
        title="Primeiro Veículo"
        submitLabel="Cadastrar e Começar"
        onSubmit={cadastrarPrimeiroVeiculo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    padding: 20,
    paddingTop: 60,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 10,
  },
  subtitulo: {
    fontSize: 15,
    color: '#3a3a3c',
    marginBottom: 24,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3a3a3c',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#e5e5ea',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1c1c1e',
    marginBottom: 16,
  },
});
