import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const CARD_W = 320;
const CARD_H = 420;
const CUT = 14; // largo de las marcas de corte

const CornerMark = ({ style }) => (
  <View style={[styles.corner, style]}>
    <View style={styles.cornerH} />
    <View style={styles.cornerV} />
  </View>
);

export default function QRCard({ visitorUrl, logoIcono, logoCompleto }) {
  return (
    <View style={styles.card}>
      {/* Marcas de corte */}
      <CornerMark style={styles.tl} />
      <CornerMark style={[styles.tr, { transform: [{ scaleX: -1 }] }]} />
      <CornerMark style={[styles.bl, { transform: [{ scaleY: -1 }] }]} />
      <CornerMark style={[styles.br, { transform: [{ scale: -1 }] }]} />

      {/* Recuadro blanco central con QR */}
      <View style={styles.qrBox}>
        <QRCode
          value={visitorUrl}
          size={180}
          logo={logoIcono}
          logoSize={36}
          logoBackgroundColor="white"
          logoBorderRadius={8}
          color="#1a1a2e"
          backgroundColor="white"
        />
        <Text style={styles.qrCaption}>
          Escanea el código QR para usar el timbre
        </Text>
      </View>

      {/* Footer con logo completo */}
      <View style={styles.footer}>
        {logoCompleto ? (
          <Image source={logoCompleto} style={styles.logoCompleto} resizeMode="contain" />
        ) : (
          <Text style={styles.logoText}>S-Doorbell</Text>
        )}
        <Text style={styles.tagline}>TIMBRE DIGITAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  corner: { position: 'absolute', width: CUT, height: CUT },
  cornerH: { position: 'absolute', top: 0, left: 0, width: CUT, height: 1.5, backgroundColor: '#555' },
  cornerV: { position: 'absolute', top: 0, left: 0, width: 1.5, height: CUT, backgroundColor: '#555' },
  tl: { top: 10, left: 10 },
  tr: { top: 10, right: 10 },
  bl: { bottom: 10, left: 10 },
  br: { bottom: 10, right: 10 },
  qrBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  qrCaption: {
    marginTop: 14,
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    maxWidth: 180,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  logoCompleto: {
    width: 120,
    height: 32,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#888',
    textTransform: 'uppercase',
  },
});
