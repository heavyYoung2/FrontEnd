import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CouncilHeader from '@/components/CouncilHeader';
import { COLORS } from '../../src/design/colors';
import { TYPO } from '../../src/design/typography';
import {
  addCouncilMember as addCouncilMemberApi,
  CouncilMember,
  CouncilStudentProfile,
  fetchCouncilMembers,
  lookupStudentById,
  removeCouncilMember as removeCouncilMemberApi,
  councilMemberKey,
} from '../../src/api/councilMembers';
import { Ionicons } from '@expo/vector-icons';

type ModalState =
  | { type: 'add'; candidate: CouncilStudentProfile }
  | { type: 'remove'; member: CouncilMember }
  | null;

type Feedback = { tone: 'error' | 'success'; text: string } | null;

export default function ManageMembersScreen() {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setFeedback(null);
      const data = await fetchCouncilMembers();
      setMembers(data);
    } catch (err) {
      console.warn('[fetchCouncilMembers] failed', err);
      setFeedback({ tone: 'error', text: '인원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  }, [loadMembers]);

  const isAddDisabled = useMemo(() => {
    return lookupLoading || input.trim().length === 0;
  }, [lookupLoading, input]);

  const normalizedInput = useMemo(() => input.trim().toUpperCase(), [input]);

  const handleAdd = useCallback(async () => {
    const trimmed = normalizedInput;
    if (!trimmed || lookupLoading) return;

    setFeedback(null);

    if (members.some((m) => m.studentId === trimmed)) {
      setFeedback({ tone: 'error', text: '이미 학생회에 등록된 학번입니다.' });
      return;
    }
    try {
      setLookupLoading(true);
      const profile = await lookupStudentById(trimmed);
      if (!profile) {
        setFeedback({ tone: 'error', text: '해당 학번의 학생이 존재하지 않습니다.' });
        return;
      }
      setModalState({ type: 'add', candidate: profile });
    } catch (err) {
      console.warn('[lookupStudentById] failed', err);
      setFeedback({ tone: 'error', text: '학생 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setLookupLoading(false);
    }
  }, [lookupLoading, normalizedInput, members]);

  const handleRemove = useCallback((member: CouncilMember) => {
    setModalState({ type: 'remove', member });
    setFeedback(null);
  }, []);

  const closeModal = useCallback(() => {
    if (modalBusy) return;
    setModalState(null);
  }, [modalBusy]);

  const handleConfirmAdd = useCallback(async () => {
    if (!modalState || modalState.type !== 'add') return;
    try {
      setModalBusy(true);
      const created = await addCouncilMemberApi(modalState.candidate.memberId);
      const createdMember: CouncilMember = {
        councilMemberId: modalState.candidate.memberId,
        studentId: modalState.candidate.studentId,
        name: modalState.candidate.name,
        ...created,
      };

      // Reflect with fresh data so the list stays in sync with the server.
      await loadMembers();
      setInput('');
      setFeedback({
        tone: 'success',
        text: `${createdMember.studentId} ${createdMember.name}님을 학생회로 추가했습니다.`,
      });
      setModalState(null);
    } catch (err) {
      console.warn('[addCouncilMember] failed', err);
      setFeedback({ tone: 'error', text: '학생회 추가에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setModalBusy(false);
    }
  }, [modalState, loadMembers]);

  const handleConfirmRemove = useCallback(async () => {
    if (!modalState || modalState.type !== 'remove') return;
    if (!modalState.member.councilMemberId) {
      setFeedback({ tone: 'error', text: '사용자 ID를 확인할 수 없어 삭제할 수 없습니다.' });
      setModalState(null);
      return;
    }
    try {
      setModalBusy(true);
      await removeCouncilMemberApi(modalState.member.councilMemberId);
      await loadMembers();
      setFeedback({
        tone: 'success',
        text: `${modalState.member.studentId} ${modalState.member.name}님을 학생회에서 제거했습니다.`,
      });
      setModalState(null);
    } catch (err) {
      console.warn('[removeCouncilMember] failed', err);
      setFeedback({ tone: 'error', text: '제거에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    } finally {
      setModalBusy(false);
    }
  }, [modalState, loadMembers]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CouncilHeader studentId="C246120" title="학생회 인원 관리하기" showBack />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.label}>학생회 추가하기</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="학번을 입력해주세요"
              value={input}
              onChangeText={(text) => setInput(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <Pressable
              onPress={handleAdd}
              disabled={isAddDisabled}
              style={({ pressed }) => [
                styles.addButton,
                isAddDisabled && styles.addButtonDisabled,
                pressed && !isAddDisabled && { opacity: 0.92 },
              ]}
            >
              {lookupLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.addButtonText}>추가</Text>
              )}
            </Pressable>
          </View>
          {feedback && (
            <Text
              style={[
                styles.feedbackText,
                feedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess,
              ]}
            >
              {feedback.text}
            </Text>
          )}
        </View>

        <View style={[styles.card, { gap: 12 }]}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <>
              {members.map((member) => (
                <View key={councilMemberKey(member)} style={styles.memberRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberId}>{member.studentId}</Text>
                    <Text style={styles.memberName}>{member.name}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(member)}
                    style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.92 }]}
                  >
                    <Text style={styles.removeButtonText}>삭제하기</Text>
                  </Pressable>
                </View>
              ))}

              {members.length === 0 && (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>등록된 학생회 인원이 없습니다.</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!modalState && modalState.type === 'add'}
        title="다음과 같은 정보의 사용자를 학생회로 추가 하시겠습니까?"
        message={modalState?.type === 'add'
          ? `${modalState.candidate.studentId} ${modalState.candidate.name}`
          : undefined}
        onCancel={closeModal}
        onConfirm={handleConfirmAdd}
        loading={modalBusy}
      />

      <ConfirmModal
        visible={!!modalState && modalState.type === 'remove'}
        title="학생회에서 제거 하시겠습니까?"
        message={modalState?.type === 'remove'
          ? `${modalState.member.studentId} ${modalState.member.name}`
          : undefined}
        onCancel={closeModal}
        onConfirm={handleConfirmRemove}
        loading={modalBusy}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  label: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Pretendard-Medium',
    color: COLORS.text,
  },
  addButton: {
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    height: 48,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },
  feedbackText: {
    marginTop: 12,
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
  },
  feedbackError: { color: '#DC2626' },
  feedbackSuccess: { color: '#0F766E' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  memberId: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  memberName: {
    fontFamily: 'Pretendard-Medium',
    color: COLORS.muted,
    marginTop: 4,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E8EDFF',
  },
  removeButtonText: {
    color: COLORS.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    ...TYPO.body,
    color: COLORS.muted,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
    loading?: boolean;
};

function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = '확인',
  cancelLabel = '취소',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.card}>
          <View style={modalStyles.iconWrap}>
            <Ionicons name="alert-circle" size={28} color={COLORS.primary} />
          </View>
          <Text style={modalStyles.title}>
            {title}
          </Text>
          {message ? <Text style={modalStyles.message}>{message}</Text> : null}

          <View style={modalStyles.actions}>
            <Pressable
              onPress={loading ? undefined : onCancel}
              style={({ pressed }) => [
                modalStyles.action,
                modalStyles.cancel,
                pressed && !loading && modalStyles.pressed,
              ]}
            >
              <Text style={modalStyles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={loading ? undefined : onConfirm}
              style={({ pressed }) => [
                modalStyles.action,
                modalStyles.confirm,
                (pressed && !loading) && modalStyles.pressed,
                loading && modalStyles.confirmDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={modalStyles.confirmLabel}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.muted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  action: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  confirm: {
    backgroundColor: COLORS.primary,
  },
  confirmDisabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.85,
  },
  cancelLabel: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  confirmLabel: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
});
