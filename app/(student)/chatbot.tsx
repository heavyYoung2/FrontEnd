import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';
import { sendChatMessage } from '@/src/api/chat';

type ChatRole = 'user' | 'assistant' | 'system';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
};

export default function StudentChatbotScreen() {
  const { bottom } = useSafeAreaInsets();
  const safeBottom = Math.max(bottom, 12);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 회비영 챗봇입니다. 궁금한 점을 입력해 주세요.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage> | null>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, scrollToEnd]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage, { id: `pending-${Date.now()}`, role: 'assistant', content: '', pending: true }]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendChatMessage(trimmed);
      setMessages((prev) => [
        ...prev.filter((m) => !m.pending),
        { id: `assistant-${Date.now()}`, role: 'assistant', content: reply },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '답변을 받지 못했습니다. 잠시 후 다시 시도해주세요.';
      setMessages((prev) => [
        ...prev.filter((m) => !m.pending),
        { id: `assistant-${Date.now()}`, role: 'assistant', content: message },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const bubbleStyle = isUser ? styles.userBubble : styles.botBubble;
    const textStyle = isUser ? styles.userText : styles.botText;

    if (item.pending) {
      return (
        <View style={[styles.messageRow, styles.botRow]}>
          <View style={[styles.botAvatar]}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
          </View>
          <View style={[styles.botBubble, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.botText}>답변을 생성 중입니다...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
          </View>
        )}
        <View style={bubbleStyle}>
          <Text style={textStyle}>{item.content}</Text>
        </View>
      </View>
    );
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <CouncilHeader badgeLabel="학생" studentId="C246120" title="챗봇" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.page }}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
          />
        </View>
        <View style={[styles.inputBar, { paddingBottom: safeBottom, backgroundColor: '#FFFFFF' }]}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            textAlignVertical="center"
            selectionColor={COLORS.primary}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
              pressed && canSend && styles.sendButtonPressed,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="arrow-up-circle" size={22} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  listContent: {
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    maxWidth: '80%',
  },
  botText: {
    ...TYPO.body,
    color: COLORS.text,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    maxWidth: '80%',
  },
  userText: {
    ...TYPO.body,
    color: '#FFFFFF',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    paddingBottom: 16,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    ...TYPO.body,
    color: COLORS.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendButtonPressed: {
    opacity: 0.9,
  },
});
