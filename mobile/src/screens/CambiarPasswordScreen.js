import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function CambiarPasswordScreen() {
  const { token, usuario, updateUsuario } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('No coinciden', 'Las contraseñas no son iguales.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password, must_change_password: false }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Error al cambiar contraseña');

      // Actualizar contexto → App.js redirige solo a CPanel
      updateUsuario({ must_change_password: false });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>S<Text style={{ color: '#4f46e5' }}>-</Text>Doorbell</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.desc}>
            Tu cuenta fue creada con una contraseña temporal. Elegí una nueva para continuar.
          </Text>

          <Text style={styles.label}>Nueva contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
          />

          <Text style={styles.label}>Confirmar contraseña</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Repetí tu contraseña"
            onSubmitEditing={handleChange}
          />

          <TouchableOpacity
            style={[styles.btnSave, loading && styles.btnDisabled]}
            onPress={handleChange}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnSaveText}>Cambiar contraseña</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 32, fontWeight: '800', color: '#1a1a2e' },
  form: {
    backgroundColor: 'white', borderRadius: 20, padding: 28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
  desc: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a2e' },
  btnSave: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  btnSaveText: { color: 'white', fontSize: 17, fontWeight: '700' },
});
