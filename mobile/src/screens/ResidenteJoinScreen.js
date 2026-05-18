import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { API_BASE } from '../context/AuthContext';

export default function ResidenteJoinScreen({ navigation }) {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!codigo.trim() || !nombre.trim()) {
      Alert.alert('Campos requeridos', 'Ingresá el código y tu nombre.');
      return;
    }

    if (!Device.isDevice) {
      Alert.alert('Dispositivo requerido', 'Las notificaciones solo funcionan en un dispositivo real.');
      return;
    }

    setLoading(true);
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para enviarte notificaciones cuando toquen el timbre.');
        return;
      }

      const push_token = (await Notifications.getExpoPushTokenAsync()).data;

      const res = await fetch(`${API_BASE}/api/residentes/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_id: codigo.trim(),
          nombre: nombre.trim(),
          push_token,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      Alert.alert(
        '¡Listo!',
        'Vas a recibir notificaciones cada vez que toquen el timbre.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
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
          <Text style={styles.title}>Unirme como residente</Text>
          <Text style={styles.desc}>
            Pedile el código de acceso al dueño de la propiedad y vas a recibir notificaciones cuando alguien toque el timbre.
          </Text>

          <Text style={styles.label}>Código de acceso</Text>
          <TextInput
            style={styles.input}
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Código que te dio el dueño"
          />

          <Text style={styles.label}>Tu nombre</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: María García"
            onSubmitEditing={handleJoin}
          />

          <TouchableOpacity
            style={[styles.btnJoin, loading && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnJoinText}>Registrarme</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
            <Text style={styles.btnBackText}>← Volver al login</Text>
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
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
  desc: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a2e' },
  btnJoin: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  btnJoinText: { color: 'white', fontSize: 17, fontWeight: '700' },
  btnBack: { alignItems: 'center', marginTop: 16 },
  btnBackText: { color: '#888', fontSize: 13 },
});
