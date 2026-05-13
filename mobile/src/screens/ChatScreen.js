import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://achkhqmqwsyxnvqimzrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjaGtocW1xd3N5eG52cWltenJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODU2NTksImV4cCI6MjA5NDE2MTY1OX0.5gkc84hlcW5dFz7J7qsc9_XDIZsjdMx8r3E0RKH_Vfc';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ChatScreen({ route }) {
  const { eventoId, visitorName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    // Cargar mensajes existentes
    sb.from('mensajes')
      .select('*')
      .eq('evento_id', eventoId)
      .order('created_at')
      .then(({ data }) => {
        if (data) setMessages(data);
      });

    // Suscribir a mensajes nuevos en tiempo real
    const channel = sb.channel(`chat:${eventoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `evento_id=eq.${eventoId}`,
      }, payload => {
        setMessages(prev => {
          // Evitar duplicados
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [eventoId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await sb.from('mensajes').insert({
      evento_id: eventoId,
      sender: 'owner',
      texto: trimmed,
    });
  };

  const renderItem = ({ item }) => {
    const isOwner = item.sender === 'owner';
    const time = new Date(item.created_at).toLocaleTimeString('es-AR', {
      hour: '2-digit', minute: '2-digit',
    });
    return (
      <View style={[styles.bubble, isOwner ? styles.bubbleOwner : styles.bubbleVisitor]}>
        <Text style={[styles.bubbleText, isOwner ? styles.textOwner : styles.textVisitor]}>
          {item.texto}
        </Text>
        <Text style={[styles.bubbleTime, isOwner ? styles.timeOwner : styles.timeVisitor]}>
          {time}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Chat con visitante</Text>
        {visitorName ? (
          <Text style={styles.headerSub}>{visitorName}</Text>
        ) : (
          <Text style={styles.headerSub}>Visitante anónimo</Text>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              El chat se abrió. Escribí un mensaje al visitante.
            </Text>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribí un mensaje..."
            maxLength={300}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.btnSend} onPress={sendMessage} activeOpacity={0.8}>
            <Text style={styles.btnSendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  list: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '78%',
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  bubbleOwner: {
    backgroundColor: '#4f46e5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleVisitor: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  textOwner: { color: 'white' },
  textVisitor: { color: '#1a1a2e' },
  bubbleTime: { fontSize: 10, marginTop: 3 },
  timeOwner: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  timeVisitor: { color: '#aaa' },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 14, lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a2e',
  },
  btnSend: {
    backgroundColor: '#4f46e5',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSendText: { color: 'white', fontSize: 18 },
});
