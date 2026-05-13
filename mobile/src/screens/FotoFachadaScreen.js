import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function FotoFachadaScreen({ navigation }) {
  const { token, usuario, updateUsuario } = useAuth();
  const [preview, setPreview] = useState(usuario.foto_fachada || null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (fromCamera = false) => {
    const method = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await method({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPreview(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!preview || preview === usuario.foto_fachada) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('foto_fachada', {
        uri: preview,
        type: 'image/jpeg',
        name: 'foto_fachada.jpg',
      });

      const res = await fetch(`${API_BASE}/api/usuarios/${usuario.id}/foto-fachada`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Error al subir');

      updateUsuario({ foto_fachada: json.foto_fachada });
      Alert.alert('¡Listo!', 'Foto actualizada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  const hasChange = preview && preview !== usuario.foto_fachada;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Foto de la propiedad</Text>
        <Text style={styles.subtitle}>
          Esta imagen se muestra al visitante cuando escanea tu QR.
        </Text>

        {/* Preview */}
        <View style={styles.previewWrap}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.previewEmpty}>
              <Text style={styles.previewEmptyIcon}>🏠</Text>
              <Text style={styles.previewEmptyText}>Sin foto</Text>
            </View>
          )}
        </View>

        {/* Botones de selección */}
        <View style={styles.pickRow}>
          <TouchableOpacity
            style={styles.btnPick}
            onPress={() => pickImage(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPickText}>🖼 Galería</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPick}
            onPress={() => pickImage(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPickText}>📷 Cámara</Text>
          </TouchableOpacity>
        </View>

        {/* Guardar */}
        <TouchableOpacity
          style={[styles.btnSave, (!hasChange || uploading) && styles.btnDisabled]}
          onPress={handleUpload}
          disabled={!hasChange || uploading}
          activeOpacity={0.8}
        >
          {uploading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.btnSaveText}>Guardar foto</Text>}
        </TouchableOpacity>

        {!hasChange && preview && (
          <Text style={styles.hint}>Seleccioná una foto nueva para poder guardar.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 6, alignSelf: 'flex-start' },
  subtitle: { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 24, alignSelf: 'flex-start' },
  previewWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#e8e8f0',
  },
  preview: { width: '100%', height: '100%' },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewEmptyIcon: { fontSize: 48, marginBottom: 8 },
  previewEmptyText: { fontSize: 14, color: '#aaa' },
  pickRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 20 },
  btnPick: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  btnPickText: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  btnSave: {
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  btnSaveText: { color: 'white', fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 12, color: '#aaa', marginTop: 12, textAlign: 'center' },
});
