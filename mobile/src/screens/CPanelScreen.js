import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, RefreshControl, Image, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, API_BASE } from '../context/AuthContext';

const logoCompleto = require('../../assets/logoCompleto.png');

export default function CPanelScreen({ navigation }) {
  const { token, usuario, logout, updateUsuario } = useAuth();
  const [stats, setStats] = useState({ timbrazo: 0, vista_qr: 0, login: 0, total: 0 });
  const [recientes, setRecientes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, eventosRes] = await Promise.all([
        fetch(`${API_BASE}/api/eventos/stats/${usuario.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/eventos/historial/${usuario.id}?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [statsJson, eventosJson] = await Promise.all([statsRes.json(), eventosRes.json()]);
      if (statsJson.success) setStats({ ...statsJson.stats, total: statsJson.total });
      if (eventosJson.success) setRecientes(eventosJson.eventos);
    } catch (_) {}
    finally { setRefreshing(false); }
  }, [token, usuario.id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const tipoLabel = usuario.tipo === 'edificio' ? '🏢 Edificio' : '🏠 Casa';

  const iconForTipo = (tipo) => {
    const map = { timbrazo: '🔔', vista_qr: '👁', login: '🔑', logout: '👋' };
    return map[tipo] || '📋';
  };

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#4f46e5" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={logoCompleto} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity onPress={handleLogout} style={styles.btnLogout}>
            <Text style={styles.btnLogoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Bienvenida */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeHi}>Hola, {usuario.nombre} 👋</Text>
          <Text style={styles.welcomeSub}>{tipoLabel} · {usuario.direccion || 'Sin dirección'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Timbrazos" value={stats.timbrazo || 0} emoji="🔔" color="#4f46e5" />
          <StatCard label="Vistas QR" value={stats.vista_qr || 0} emoji="👁" color="#0891b2" />
          <StatCard label="Total" value={stats.total || 0} emoji="📋" color="#16a34a" />
        </View>

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.actionsGrid}>
          <ActionBtn
            emoji="🔲"
            label="Ver QR"
            onPress={() => navigation.navigate('QRViewer', {
              visitorUrl: `${API_BASE.replace('5000', '5000')}/visit/${usuario.qr_id}`,
              qrId: usuario.qr_id,
            })}
            color="#4f46e5"
          />
          <ActionBtn
            emoji="✏️"
            label="Mi perfil"
            onPress={() => navigation.navigate('EditProfile', { token, usuario })}
            color="#0891b2"
          />
          {usuario.tipo === 'edificio' ? (
            <ActionBtn
              emoji="🏢"
              label="Unidades"
              onPress={() => navigation.navigate('Unidades', { token, userId: usuario.id })}
              color="#d97706"
            />
          ) : (
            <ActionBtn
              emoji="👥"
              label="Residentes"
              onPress={() => navigation.navigate('Residentes', { token, userId: usuario.id })}
              color="#d97706"
            />
          )}
          <ActionBtn
            emoji="📋"
            label="Historial"
            onPress={() => navigation.navigate('Historial')}
            color="#6d28d9"
          />
          <ActionBtn
            emoji="📸"
            label="Foto"
            onPress={() => navigation.navigate('FotoFachada')}
            color="#db2777"
          />
        </View>

        {/* Eventos recientes */}
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        {recientes.length === 0 ? (
          <Text style={styles.emptyText}>Sin actividad todavía.</Text>
        ) : (
          recientes.map(ev => (
            <View key={ev.id} style={styles.eventRow}>
              <View style={styles.eventIconWrap}>
                <Text style={styles.eventIcon}>{iconForTipo(ev.tipo)}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventType}>
                  {ev.tipo === 'timbrazo' ? 'Timbrazo' :
                   ev.tipo === 'vista_qr' ? 'Vista de QR' :
                   ev.tipo === 'login' ? 'Inicio de sesión' : ev.tipo}
                  {ev.visitor_name ? ` · ${ev.visitor_name}` : ''}
                </Text>
                <Text style={styles.eventTime}>{timeAgo(ev.created_at)}</Text>
              </View>
              {ev.tipo === 'timbrazo' && (
                <TouchableOpacity
                  style={styles.btnChat}
                  onPress={() => navigation.navigate('Chat', {
                    eventoId: ev.id,
                    visitorName: ev.visitor_name,
                  })}
                >
                  <Text style={styles.btnChatText}>Chat</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, emoji, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({ emoji, label, onPress, color }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
        <Text style={styles.actionEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: { width: 120, height: 32 },
  btnLogout: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f0f0f0' },
  btnLogoutText: { fontSize: 13, color: '#666', fontWeight: '600' },
  welcome: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  welcomeHi: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  welcomeSub: { fontSize: 13, color: '#888', marginTop: 3 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  eventIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#f0f0f8', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  eventIcon: { fontSize: 18 },
  eventInfo: { flex: 1 },
  eventType: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  eventTime: { fontSize: 12, color: '#aaa', marginTop: 2 },
  btnChat: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnChatText: { color: 'white', fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: '#aaa', fontSize: 14, paddingVertical: 20 },
});
