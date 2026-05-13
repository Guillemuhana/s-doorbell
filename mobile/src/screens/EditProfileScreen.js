import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
  const { token, usuario, updateUsuario } = useAuth();

  const [form, setForm] = useState({
    nombre: usuario.nombre || '',
    apellido: usuario.apellido || '',
    telefono: usuario.telefono || '',
    direccion: usuario.direccion || '',
    lat: usuario.lat?.toString() || '',
    lng: usuario.lng?.toString() || '',
    tipo: usuario.tipo || 'casa',
  });
  const [saving, setSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleUseLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      set('lat', loc.coords.latitude.toFixed(7));
      set('lng', loc.coords.longitude.toFixed(7));
    } catch (e) {
      Alert.alert('Error', 'No se pudo obtener la ubicación: ' + e.message);
    } finally {
      setLocLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y apellido son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        tipo: form.tipo,
      };

      const res = await fetch(`${API_BASE}/api/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Error al guardar');

      updateUsuario(body);
      Alert.alert('¡Listo!', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nombre *</Text>
        <TextInput style={styles.input} value={form.nombre} onChangeText={v => set('nombre', v)} />

        <Text style={styles.label}>Apellido *</Text>
        <TextInput style={styles.input} value={form.apellido} onChangeText={v => set('apellido', v)} />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput style={styles.input} value={form.telefono} onChangeText={v => set('telefono', v)} keyboardType="phone-pad" />

        <Text style={styles.label}>Dirección</Text>
        <TextInput style={styles.input} value={form.direccion} onChangeText={v => set('direccion', v)} />

        {/* Tipo de propiedad */}
        <Text style={styles.sectionTitle}>Tipo de propiedad</Text>
        <View style={styles.tipoRow}>
          {['casa', 'edificio'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tipoBtn, form.tipo === t && styles.tipoBtnActive]}
              onPress={() => set('tipo', t)}
            >
              <Text style={[styles.tipoBtnText, form.tipo === t && styles.tipoBtnTextActive]}>
                {t === 'casa' ? '🏠 Casa' : '🏢 Edificio'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Geo */}
        <Text style={styles.sectionTitle}>📍 Ubicación (geo anti-spam)</Text>
        <Text style={styles.hint}>
          Visitantes a más de 100m no podrán tocar el timbre.
        </Text>

        <TouchableOpacity
          style={[styles.btnLocation, locLoading && styles.btnDisabled]}
          onPress={handleUseLocation}
          disabled={locLoading}
          activeOpacity={0.8}
        >
          {locLoading
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={styles.btnLocationText}>📍 Usar mi ubicación actual</Text>}
        </TouchableOpacity>

        <View style={styles.coordsRow}>
          <View style={styles.coordField}>
            <Text style={styles.label}>Latitud</Text>
            <TextInput
              style={styles.input}
              value={form.lat}
              onChangeText={v => set('lat', v)}
              keyboardType="numbers-and-punctuation"
              placeholder="-34.6037"
            />
          </View>
          <View style={[styles.coordField, { marginLeft: 12 }]}>
            <Text style={styles.label}>Longitud</Text>
            <TextInput
              style={styles.input}
              value={form.lng}
              onChangeText={v => set('lng', v)}
              keyboardType="numbers-and-punctuation"
              placeholder="-58.3816"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnSave, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.btnSaveText}>Guardar cambios</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a2e' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginTop: 28, marginBottom: 8 },
  hint: { fontSize: 12, color: '#888', lineHeight: 18, marginBottom: 12 },
  tipoRow: { flexDirection: 'row', gap: 10 },
  tipoBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#e0e0e0', alignItems: 'center', backgroundColor: 'white' },
  tipoBtnActive: { borderColor: '#4f46e5', backgroundColor: '#f0f0ff' },
  tipoBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tipoBtnTextActive: { color: '#4f46e5' },
  btnLocation: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  btnLocationText: { color: 'white', fontWeight: '700', fontSize: 14 },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  coordsRow: { flexDirection: 'row' },
  coordField: { flex: 1 },
  btnSave: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 28 },
  btnSaveText: { color: 'white', fontSize: 17, fontWeight: '700' },
});
