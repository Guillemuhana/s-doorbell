import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, SafeAreaView, RefreshControl,
} from 'react-native';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function UnidadesScreen() {
  const { token, usuario } = useAuth();
  const userId = usuario.id;

  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchUnidades = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/unidades/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setUnidades(json.unidades);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar las unidades.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, userId]);

  useEffect(() => { fetchUnidades(); }, [fetchUnidades]);

  const handleAdd = async () => {
    if (!nombre.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/unidades/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setNombre('');
      fetchUnidades();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Eliminar unidad', `¿Eliminar la unidad ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/unidades/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setUnidades(prev => prev.filter(u => u.id !== id));
          } catch (e) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Unidades del edificio</Text>
      <Text style={styles.subtitle}>Cada unidad puede tener su propio token de notificación.</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Ej: 1A, 2B, PH"
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="characters"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={[styles.btnAdd, adding && styles.btnDisabled]} onPress={handleAdd} disabled={adding}>
          {adding ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.btnAddText}>+</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={unidades}
        keyExtractor={item => item.id}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUnidades(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>Todavía no hay unidades.</Text>}
        renderItem={({ item }) => (
          <View style={styles.unitCard}>
            <Text style={styles.unitName}>{item.nombre}</Text>
            <Text style={styles.unitMeta}>{item.push_token_residente ? '🔔' : '🔕'}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.nombre)} style={styles.btnDelete}>
              <Text style={styles.btnDeleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        columnWrapperStyle={styles.gridRow}
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
  gridRow: { gap: 10, marginBottom: 10 },
  unitCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, elevation: 1, position: 'relative',
  },
  unitName: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  unitMeta: { fontSize: 14, marginTop: 4 },
  btnDelete: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  btnDeleteText: { color: '#dc2626', fontSize: 10, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 14 },
});
