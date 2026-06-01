import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UsuarioService, type Usuario } from '../src/services/usuarioService';

export default function UserGreeting() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    setUsuario(UsuarioService.carregarUsuario());
  }, []);

  if (!usuario) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {usuario.nome}!</Text>
      <Text style={styles.subtitle}>Vamos otimizar seu consumo hoje?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e' },
  subtitle: { fontSize: 14, color: '#6e6e73', marginTop: 2 },
});
