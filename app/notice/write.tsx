// app/notice/write.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addEvent } from '../../src/api/event';
import CouncilHeader from '@/components/CouncilHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/auth/AuthProvider';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
};

const MAX_SINGLE_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const MAX_TOTAL_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

export default function NoticeWriteScreen() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [picking, setPicking] = useState(false);

  const openPicker = (type: 'start' | 'end') => {
    const base =
      type === 'start'
        ? startDate ?? endDate ?? new Date()
        : endDate ?? startDate ?? new Date();
    setTempDate(base);
    setActivePicker(type);
  };

  const handlePickImage = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('알림', '사진 접근 권한이 필요합니다.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.6,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (!result.canceled) {
        const { accepted, rejectedNames } = filterOversizedImages(images, result.assets);
        if (rejectedNames.length) {
          Alert.alert('용량 제한', `이미지 용량이 너무 큽니다. 다른 사진을 선택해주세요.\n(${rejectedNames.join(', ')})`);
        }
        if (accepted.length) {
          setImages((prev) => [...prev, ...accepted]);
        }
      }
    } finally {
      setPicking(false);
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const handleConfirmDate = (type: 'start' | 'end' | null, nextDate: Date) => {
    if (!type) return;

    if (type === 'start') {
      if (endDate && nextDate > endDate) {
        Alert.alert('날짜 확인', '시작일이 종료일보다 늦을 수 없습니다.');
        return;
      }
      setStartDate(nextDate);
    } else {
      if (startDate && nextDate < startDate) {
        Alert.alert('날짜 확인', '종료일은 시작일 이후여야 합니다.');
        return;
      }
      setEndDate(nextDate);
    }

    setActivePicker(null);
  };

  const onSubmit = async () => {
    if (!title.trim()) return Alert.alert('오류', '제목을 입력하세요.');
    if (!content.trim()) return Alert.alert('오류', '내용을 입력하세요.');

    if (startDate && endDate && startDate > endDate) {
      Alert.alert('날짜 확인', '시작일은 종료일보다 빠르거나 같아야 합니다.');
      return;
    }

    try {
      const res = await addEvent(
        {
          title: title.trim(),
          content: content.trim(),
          eventStartDate: formatDateValue(startDate),
          eventEndDate: formatDateValue(endDate),
        },
        images.map((asset, idx) => ({
          uri: asset.uri,
          name: asset.fileName ?? `image-${idx + 1}.jpg`,
          type: asset.mimeType ?? 'image/jpeg',
        }))
      );
      Alert.alert('완료', `공지 생성 성공 (id=${res.eventId})`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 413
          ? '첨부 이미지 용량이 서버 제한을 초과했습니다. 사진 크기를 줄이거나 개수를 줄여주세요.'
          : e?.response?.data?.message || e?.message || '요청 실패';
      Alert.alert('실패', String(msg));
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <CouncilHeader studentId="C246120" title="공지 작성" showBack />

        {!isAuthenticated && !authLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
            <Text style={{ color: COLORS.text, fontFamily: 'Pretendard-Medium', textAlign: 'center' }}>로그인이 필요합니다!</Text>
            <Pressable
              onPress={() => router.replace('/auth')}
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.submitText}>로그인하러 가기</Text>
            </Pressable>
          </View>
        ) : (
          <>

        {/* (3) 입력 카드 */}
        <View style={styles.card}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>내용</Text>
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="내용을 입력하세요"
          />

          <Text style={[styles.label, { marginTop: 12 }]}>시작일</Text>
          <Pressable
            onPress={() => openPicker('start')}
            style={({ pressed }) => [styles.dateInput, pressed && styles.dateInputPressed]}
          >
            <Text style={[styles.dateText, !startDate && styles.datePlaceholder]}>
              {formatDisplayDate(startDate) ?? '날짜 선택'}
            </Text>
          </Pressable>

          <Text style={[styles.label, { marginTop: 12 }]}>종료일</Text>
          <Pressable
            onPress={() => openPicker('end')}
            style={({ pressed }) => [styles.dateInput, pressed && styles.dateInputPressed]}
          >
            <Text style={[styles.dateText, !endDate && styles.datePlaceholder]}>
              {formatDisplayDate(endDate) ?? '날짜 선택'}
            </Text>
          </Pressable>

          <Text style={[styles.label, { marginTop: 12 }]}>이미지</Text>
          <ScrollView horizontal contentContainerStyle={styles.imageRow} showsHorizontalScrollIndicator={false}>
            {images.map((img) => (
              <View key={img.uri} style={styles.imageWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                <Pressable
                  onPress={() => handleRemoveImage(img.uri)}
                  style={({ pressed }) => [styles.removeBadge, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.removeBadgeText}>×</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={handlePickImage}
              style={({ pressed }) => [styles.addImageButton, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.addImageText}>{picking ? '열기 중...' : '+ 추가'}</Text>
            </Pressable>
          </ScrollView>

          <Pressable
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.95 },
            ]}
          >
            <Text style={styles.submitText}>등록하기</Text>
          </Pressable>
        </View>

        <DateModal
          visible={!!activePicker}
          value={tempDate}
          onChange={setTempDate}
          onDismiss={() => setActivePicker(null)}
          onConfirm={() => handleConfirmDate(activePicker, tempDate)}
        />
          </>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

function formatDisplayDate(date: Date | null) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일`;
}

function formatDateValue(date: Date | null) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function filterOversizedImages(
  current: ImagePicker.ImagePickerAsset[],
  next: ImagePicker.ImagePickerAsset[]
) {
  let total = current.reduce((sum, img) => sum + (img.fileSize ?? 0), 0);
  const accepted: ImagePicker.ImagePickerAsset[] = [];
  const rejectedNames: string[] = [];

  next.forEach((asset) => {
    const size = asset.fileSize ?? 0;
    if (size && size > MAX_SINGLE_IMAGE_BYTES) {
      rejectedNames.push(asset.fileName ?? asset.uri);
      return;
    }
    if (size && total + size > MAX_TOTAL_IMAGE_BYTES) {
      rejectedNames.push(asset.fileName ?? asset.uri);
      return;
    }
    accepted.push(asset);
    total += size;
  });

  return { accepted, rejectedNames };
}

type DateModalProps = {
  visible: boolean;
  value: Date;
  onChange: (value: Date) => void;
  onDismiss: () => void;
  onConfirm: () => void;
};

function DateModal({ visible, value, onChange, onDismiss, onConfirm }: DateModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={value}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              locale="ko"
              onChange={(_, selected) => {
                if (selected) onChange(selected);
              }}
            />
          </View>
          <View style={styles.modalActions}>
            <Pressable onPress={onDismiss} style={({ pressed }) => [styles.modalBtn, pressed && styles.modalBtnPressed]}>
              <Text style={styles.modalBtnText}>취소</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={({ pressed }) => [styles.modalBtn, styles.modalConfirmBtn, pressed && styles.modalBtnPressed]}>
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>확인</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  /** 입력 카드 */
  card: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 12,
  },
  label: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: COLORS.text,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  dateInputPressed: {
    opacity: 0.92,
  },
  dateText: {
    color: COLORS.text,
    fontFamily: 'Pretendard-Medium',
    fontSize: 14,
  },
  datePlaceholder: {
    color: COLORS.muted,
  },
  submitBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalBtnPressed: {
    opacity: 0.9,
  },
  modalBtnText: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
  },
  imageRow: { alignItems: 'center', gap: 12 },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  imageThumb: { width: '100%', height: '100%' },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: { color: '#FFF', fontSize: 14, fontFamily: 'Pretendard-SemiBold' },
  addImageButton: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addImageText: {
    color: COLORS.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
});
