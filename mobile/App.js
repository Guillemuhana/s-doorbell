import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { AuthProvider, useAuth, API_BASE } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import CambiarPasswordScreen from './src/screens/CambiarPasswordScreen';
import CPanelScreen from './src/screens/CPanelScreen';
import QRViewerScreen from './src/screens/QRViewerScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ResidentesScreen from './src/screens/ResidentesScreen';
import UnidadesScreen from './src/screens/UnidadesScreen';
import ChatScreen from './src/screens/ChatScreen';
import HistorialScreen from './src/screens/HistorialScreen';
import FotoFachadaScreen from './src/screens/FotoFachadaScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { token, usuario, loading } = useAuth();
  const navigationRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Registrar push token al loguearse
  useEffect(() => {
    if (!token || !usuario) return;
    registerPushToken(token, usuario.id);

    // Listener: notificación llega con app abierta
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    // Listener: usuario toca la notificación → abrir ChatScreen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.type === 'timbrazo' && data?.evento_id && navigationRef.current) {
        navigationRef.current.navigate('Chat', {
          eventoId: data.evento_id,
          visitorName: data.visitorName || null,
        });
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token, usuario]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1a1a2e',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      >
        {!token ? (
          // Stack de autenticación
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="CambiarPassword"
              component={CambiarPasswordScreen}
              options={{ title: 'Nueva contraseña', headerBackVisible: false }}
            />
          </>
        ) : usuario?.must_change_password ? (
          // Forzar cambio de contraseña
          <Stack.Screen
            name="CambiarPassword"
            component={CambiarPasswordScreen}
            options={{ title: 'Nueva contraseña', headerBackVisible: false }}
          />
        ) : (
          // Stack principal
          <>
            <Stack.Screen name="CPanel" component={CPanelScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="QRViewer"
              component={QRViewerScreen}
              options={{ title: 'Tu código QR' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Editar perfil' }}
            />
            <Stack.Screen
              name="Residentes"
              component={ResidentesScreen}
              options={{ title: 'Residentes' }}
            />
            <Stack.Screen
              name="Unidades"
              component={UnidadesScreen}
              options={{ title: 'Unidades' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'Chat con visitante' }}
            />
            <Stack.Screen
              name="Historial"
              component={HistorialScreen}
              options={{ title: 'Historial' }}
            />
            <Stack.Screen
              name="FotoFachada"
              component={FotoFachadaScreen}
              options={{ title: 'Foto de la propiedad' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

async function registerPushToken(token, userId) {
  try {
    if (!Device.isDevice) return;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const pushToken = (await Notifications.getExpoPushTokenAsync()).data;

    await fetch(`${API_BASE}/api/notificaciones/guardar-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ push_token: pushToken }),
    });
  } catch (e) {
    console.warn('Push token registration failed:', e.message);
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
