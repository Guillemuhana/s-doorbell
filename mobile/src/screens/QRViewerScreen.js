import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import QRCard from '../components/QRCard';
import { useAuth, API_BASE } from '../context/AuthContext';

const logoIcono = require('../../assets/logoIcono.png');
const logoCompleto = require('../../assets/logoCompleto.png');

export default function QRViewerScreen({ route }) {
  const { visitorUrl: initialUrl } = route.params;
  const { token, usuario, updateUsuario } = useAuth();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [visitorUrl, setVisitorUrl] = useState(initialUrl);

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerar QR',
      'El QR actual dejará de funcionar y se creará uno nuevo. ¿Continuás?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Regenerar', style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              const res = await fetch(`${API_BASE}/api/usuarios/${usuario.id}/regenerar-qr`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              const json = await res.json();
              if (!json.success) throw new Error(json.message);
              setVisitorUrl(json.visitor_url);
              updateUsuario({ qr_id: json.qr_id, qr_image: json.qr_image });
              Alert.alert('¡Listo!', 'Tu QR fue renovado. El anterior ya no funciona.');
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setRegenerating(false);
            }
          },
        },
      ],
    );
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const uri = await cardRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Compartir no disponible', 'Tu dispositivo no soporta esta función.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Guardar tarjeta QR S-Doorbell',
        UTI: 'public.png',
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar la tarjeta: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tu tarjeta QR</Text>
        <Text style={styles.subtitle}>
          Imprimí esta tarjeta y colocala en tu puerta
        </Text>

        <ViewShot
          ref={cardRef}
          options={{ format: 'png', quality: 1.0 }}
          style={styles.shotWrap}
        >
          <QRCard
            visitorUrl={visitorUrl}
            logoIcono={logoIcono}
            logoCompleto={logoCompleto}
          />
        </ViewShot>

        <TouchableOpacity
          style={[styles.btnDownload, downloading && styles.btnDisabled]}
          onPress={handleDownload}
          disabled={downloading}
          activeOpacity={0.8}
        >
          {downloading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>⬇ Descargar tarjeta</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          La tarjeta se guardará como imagen PNG en tu galería o podrás compartirla directamente.
        </Text>

        <TouchableOpacity
          style={[styles.btnRegenerate, regenerating && styles.btnDisabled]}
          onPress={handleRegenerate}
          disabled={regenerating}
          activeOpacity={0.8}
        >
          {regenerating
            ? <ActivityIndicator color="#dc2626" />
            : <Text style={styles.btnRegenerateText}>🔄 Regenerar QR</Text>}
        </TouchableOpacity>
        <Text style={styles.hintDanger}>
          Úsalo solo si creés que alguien está abusando de tu timbre.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28, textAlign: 'center' },
  shotWrap: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 28,
  },
  btnDownload: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  btnText: { color: 'white', fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
  btnRegenerate: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  btnRegenerateText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
  hintDanger: { fontSize: 11, color: '#dc2626', textAlign: 'center', marginTop: 8, opacity: 0.7 },
});
