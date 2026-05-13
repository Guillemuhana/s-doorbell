import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const API_BASE = 'https://s-doorbell-production.up.railway.app';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('usuario'),
      ]);

      if (!storedToken || !storedUser) return;

      // Verificar que el token sigue siendo válido contra el backend
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (res.ok) {
        const json = await res.json();
        // Usar datos frescos del servidor
        const freshUser = json.usuario;
        await AsyncStorage.setItem('usuario', JSON.stringify(freshUser));
        setToken(storedToken);
        setUsuario(freshUser);
      } else {
        // Token vencido o inválido — limpiar
        await AsyncStorage.multiRemove(['token', 'usuario']);
      }
    } catch (_) {
      // Sin red — usar datos cacheados para no bloquear al usuario
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('usuario'),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUsuario(JSON.parse(storedUser));
        }
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Credenciales inválidas');

    await AsyncStorage.setItem('token', json.token);
    await AsyncStorage.setItem('usuario', JSON.stringify(json.usuario));
    setToken(json.token);
    setUsuario(json.usuario);
    return json;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'usuario']);
    setToken(null);
    setUsuario(null);
  };

  const updateUsuario = (updates) => {
    const updated = { ...usuario, ...updates };
    setUsuario(updated);
    AsyncStorage.setItem('usuario', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ token, usuario, loading, login, logout, updateUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
