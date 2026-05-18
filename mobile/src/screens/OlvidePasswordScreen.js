import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { API_BASE } from '../context/AuthContext';

export default function OlvidePasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Ingresá tu email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSent(true);
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
          {sent ? (
            <>
              <Text style={styles.successIcon}>📬</Text>
              <Text style={styles.title}>Revisá tu email</Text>
              <Text style={styles.desc}>
                Si el email está registrado, vas a recibir una contraseña temporal en breve. Ingresá con ella y la app te pedirá que elijas una nueva.
              </Text>
              <TouchableOpacity
                style={styles.btnLogin}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.btnLoginText}>Volver al login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Olvidé mi contraseña</Text>
              <Text style={styles.desc}>
                Ingresá tu email y te enviamos una contraseña temporal para recuperar el acceso.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="tu@email.com"
                onSubmitEditing={handleSend}
              />

              <TouchableOpacity
                style={[styles.btnSend, loading && styles.btnDisabled]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.btnSendText}>Enviar instrucciones</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
                <Text style={styles.btnBackText}>← Volver al login</Text>
              </TouchableOpacity>
            </>
          )}
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
    alignItems: 'stretch',
  },
  successIcon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
  desc: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a2e' },
  btnSend: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  btnSendText: { color: 'white', fontSize: 17, fontWeight: '700' },
  btnLogin: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnLoginText: { color: 'white', fontSize: 17, fontWeight: '700' },
  btnBack: { alignItems: 'center', marginTop: 16 },
  btnBackText: { color: '#888', fontSize: 13 },
});
