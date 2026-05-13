import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import QRCard from '../components/QRCard';

const logoIcono = require('../../assets/logoIcono.png');
const logoCompleto = require('../../assets/logoCompleto.png');

export default function QRViewerScreen({ route }) {
  const { visitorUrl, qrId } = route.params;
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

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
});
