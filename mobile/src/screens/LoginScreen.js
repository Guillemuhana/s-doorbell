import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresá tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const json = await login(email, password);
      // App.js maneja la navegación automáticamente via el estado del AuthContext.
      // Si must_change_password, el navigator renderiza CambiarPassword.
      // Si no, renderiza CPanel. No hace falta navigation.replace acá.
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
          <Text style={styles.logoSub}>TIMBRE DIGITAL</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Iniciar sesión</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="tu@email.com"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.btnLogin, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnLoginText}>Ingresar</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('OlvidePassword')}
            style={styles.btnResidente}
          >
            <Text style={styles.btnResidenteText}>Olvidé mi contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ResidenteJoin')}
            style={styles.btnResidente}
          >
            <Text style={styles.btnResidenteText}>Soy residente · unirme a una propiedad</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: '#1a1a2e' },
  logoSub: { fontSize: 10, letterSpacing: 4, color: '#888', marginTop: 4 },
  form: {
    backgroundColor: 'white', borderRadius: 20, padding: 28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a2e' },
  btnLogin: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  btnLoginText: { color: 'white', fontSize: 17, fontWeight: '700' },
  btnResidente: { alignItems: 'center', marginTop: 16 },
  btnResidenteText: { color: '#4f46e5', fontSize: 13, fontWeight: '600' },
});
