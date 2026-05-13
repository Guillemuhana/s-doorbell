import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView, RefreshControl,
} from 'react-native';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function ResidentesScreen() {
  const { token, usuario } = useAuth();
  const userId = usuario.id;

  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchResidentes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/residentes/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setResidentes(json.residentes);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los residentes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userId]);

  useEffect(() => { fetchResidentes(); }, [fetchResidentes]);

  const handleAdd = async () => {
    if (!nombre.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/residentes/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setNombre('');
      fetchResidentes();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Eliminar residente', `¿Eliminar a ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/residentes/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setResidentes(prev => prev.filter(r => r.id !== id));
          } catch (e) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Residentes</Text>
      <Text style={styles.subtitle}>Recibirán notificaciones cuando alguien toque el timbre.</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Nombre del residente"
          value={nombre}
          onChangeText={setNombre}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={[styles.btnAdd, adding && styles.btnDisabled]} onPress={handleAdd} disabled={adding}>
          {adding ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.btnAddText}>+</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={residentes}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchResidentes(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Todavía no hay residentes.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.nombre}</Text>
              <Text style={styles.rowMeta}>
                {item.push_token ? '🔔 Con notificaciones' : '🔕 Sin notificaciones'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.nombre)} style={styles.btnDelete}>
              <Text style={styles.btnDeleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', margin: 24, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginHorizontal: 24, marginBottom: 16, lineHeight: 18 },
  addRow: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 16, gap: 10 },
  addInput: { flex: 1, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 15 },
  btnAdd: { backgroundColor: '#4f46e5', width: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnAddText: { color: 'white', fontSize: 24, fontWeight: '600' },
  btnDisabled: { backgroundColor: '#a5a5a5' },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  row: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  rowMeta: { fontSize: 12, color: '#888', marginTop: 3 },
  btnDelete: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  btnDeleteText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 14 },
});
