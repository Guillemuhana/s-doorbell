import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth, API_BASE } from '../context/AuthContext';

const TIPO_CONFIG = {
  timbrazo:  { emoji: '🔔', label: 'Timbrazo',        color: '#4f46e5' },
  vista_qr:  { emoji: '👁',  label: 'Vista de QR',     color: '#0891b2' },
  login:     { emoji: '🔑', label: 'Inicio de sesión', color: '#16a34a' },
  logout:    { emoji: '👋', label: 'Cierre de sesión', color: '#888'    },
};

export default function HistorialScreen() {
  const { token, usuario } = useAuth();
  const navigation = useNavigation();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (pageNum = 1, replace = true) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/eventos/historial/${usuario.id}?page=${pageNum}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (!json.success) return;

      setEventos(prev => replace ? json.eventos : [...prev, ...json.eventos]);
      setHasMore(pageNum < json.pagination.pages);
      setPage(pageNum);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token, usuario.id]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchPage(1, true);
  }, [fetchPage]));

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchPage(page + 1, false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const cfg = TIPO_CONFIG[item.tipo] || { emoji: '📋', label: item.tipo, color: '#888' };
    return (
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
          <Text style={styles.icon}>{cfg.emoji}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.tipo}>{cfg.label}</Text>
          {item.visitor_name ? (
            <Text style={styles.visitor}>👤 {item.visitor_name}</Text>
          ) : null}
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          {item.tipo === 'timbrazo' && (
            <View style={styles.tags}>
              <Tag
                label={item.notification_sent ? '🔔 Notificado' : '🔕 Sin notificar'}
                color={item.notification_sent ? '#16a34a' : '#888'}
              />
            </View>
          )}
        </View>

        {item.tipo === 'timbrazo' && (
          <TouchableOpacity
            style={styles.btnChat}
            onPress={() => navigation.navigate('Chat', {
              eventoId: item.id,
              visitorName: item.visitor_name,
            })}
          >
            <Text style={styles.btnChatText}>💬</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={eventos}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPage(1, true); }}
            tintColor="#4f46e5"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={<Text style={styles.header}>Historial de actividad</Text>}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator style={{ margin: 16 }} color="#4f46e5" />
            : !hasMore && eventos.length > 0
            ? <Text style={styles.noMore}>— Fin del historial —</Text>
            : null
        }
        ListEmptyComponent={<Text style={styles.empty}>Sin actividad registrada.</Text>}
      />
    </SafeAreaView>
  );
}

function Tag({ label, color }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '18' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    fontSize: 22, fontWeight: '800', color: '#1a1a2e',
    padding: 24, paddingBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  tipo: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  visitor: { fontSize: 13, color: '#555', marginTop: 2 },
  date: { fontSize: 12, color: '#aaa', marginTop: 3 },
  tags: { flexDirection: 'row', marginTop: 5, gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600' },
  btnChat: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#eff0ff', alignItems: 'center', justifyContent: 'center',
  },
  btnChatText: { fontSize: 18 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 14 },
  noMore: { textAlign: 'center', color: '#ccc', fontSize: 12, marginVertical: 16 },
});
