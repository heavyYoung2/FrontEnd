// app/notice/edit/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAdminEventDetail, updateAdminEvent } from '../../../src/api/adminEvents';
import CouncilHeader from '@/components/CouncilHeader';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
  primary: '#2E46F0', text: '#111827', muted: '#6F7680',
  border: '#E6E8EE', surface: '#FFFFFF', bg: '#F5F7FA',
};

const MAX_SINGLE_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const MAX_TOTAL_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await getAdminEventDetail(Number(id));
        setTitle(d.title ?? '');
        setContent(d.content ?? '');
        setStart(d.eventStartDate ?? '');
        setEnd(d.eventEndDate ?? '');
        setExistingImages(d.imageUrls ?? []);
      } catch (e: any) {
        Alert.alert('에러', e?.response?.data?.message || e?.message || '불러오기 실패');
      }
    })();
  }, [id]);

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
        const { accepted, rejectedNames } = filterOversizedImages(newImages, result.assets);
        if (rejectedNames.length) {
          Alert.alert('용량 제한', `이미지 용량이 너무 큽니다. 다른 사진을 선택해주세요.\n(${rejectedNames.join(', ')})`);
        }
        if (accepted.length) {
          setNewImages((prev) => [...prev, ...accepted]);
        }
      }
    } finally {
      setPicking(false);
    }
  };

  const handleRemoveExisting = (uri: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== uri));
  };

  const handleRemoveNew = (uri: string) => {
    setNewImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const imagesToShow = useMemo(() => {
    const existing = existingImages.map((uri) => ({ uri, type: 'existing' as const }));
    const added = newImages.map((asset) => ({ uri: asset.uri, type: 'new' as const }));
    return [...existing, ...added];
  }, [existingImages, newImages]);

  const onSubmit = async () => {
    if (!title.trim()) return Alert.alert('오류', '제목을 입력하세요.');
    if (!content.trim()) return Alert.alert('오류', '내용을 입력하세요.');
    setSubmitting(true);
    try {
      const imagesPayload =
        newImages.length > 0
          ? newImages.map((asset, idx) => ({
              uri: asset.uri,
              name: asset.fileName ?? `image-${idx + 1}.jpg`,
              type: asset.mimeType ?? 'image/jpeg',
            }))
          : undefined;

      await updateAdminEvent(Number(id), {
        title: title.trim(),
        content: content.trim(),
        eventStartDate: start || undefined,
        eventEndDate: end || undefined,
      }, imagesPayload);
      Alert.alert('완료', '수정되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        status === 413
          ? '첨부 이미지 용량이 서버 제한을 초과했습니다. 사진 크기를 줄이거나 개수를 줄여주세요.'
          : e?.response?.data?.message || e?.message || '수정 실패';
      Alert.alert('실패', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'left', 'right']}>
      <CouncilHeader studentId="C246120" title="공지 수정" showBack />

      <View style={styles.card}>
        <Text style={styles.label}>제목</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="제목" />

        <Text style={[styles.label, { marginTop: 12 }]}>내용</Text>
        <TextInput
          style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
          value={content}
          onChangeText={setContent}
          multiline
          placeholder="내용"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>시작일 (yyyy-MM-dd)</Text>
        <TextInput style={styles.input} value={start} onChangeText={setStart} placeholder="2025-07-06" />

        <Text style={[styles.label, { marginTop: 12 }]}>종료일 (yyyy-MM-dd)</Text>
        <TextInput style={styles.input} value={end} onChangeText={setEnd} placeholder="2025-07-07" />

        <Text style={[styles.label, { marginTop: 12 }]}>이미지</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {imagesToShow.map((img) => (
            <View key={img.uri} style={styles.imageWrap}>
              <Image source={{ uri: img.uri }} style={styles.imageThumb} />
              <Pressable
                onPress={() => (img.type === 'existing' ? handleRemoveExisting(img.uri) : handleRemoveNew(img.uri))}
                style={({ pressed }) => [styles.removeBadge, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [styles.addImageButton, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.addImageText}>+ 추가</Text>
          </Pressable>
        </ScrollView>

        <Pressable onPress={onSubmit} style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.95 }]}>
          <Text style={styles.submitText}>{submitting ? '저장 중...' : '저장하기'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 12 },
  label: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: COLORS.text,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  submitBtn: {
    marginTop: 16, height: 52, borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'Pretendard-SemiBold' },
});

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
