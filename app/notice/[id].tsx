// app/notice/[id].tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAdminEventDetail,
  AdminEventDetail,
  deleteAdminEvent,
} from '../../src/api/adminEvents';
import CouncilHeader from '@/components/CouncilHeader';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
  danger: '#EA4335',
};

export default function NoticeDetail() {
  const { id, readonly, role } = useLocalSearchParams<{
    id: string;
    readonly?: string;
    role?: string;
  }>();
  const router = useRouter();

  const [detail, setDetail] = useState<AdminEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const isReadonly = readonly === '1' || readonly === 'true';
  const badgeLabel = role === 'student' ? '학생' : '학생회';
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminEventDetail(Number(id));
      setDetail(data);
    } catch (e: any) {
      Alert.alert('에러', e?.response?.data?.message || e?.message || '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 최초 1회 로딩
  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // 수정 후 돌아왔을 때 자동 반영
  useFocusEffect(
    React.useCallback(() => {
      fetchDetail();
      return undefined;
    }, [fetchDetail])
  );

  const onDelete = () => {
    Alert.alert('삭제하기', '정말로 이 공지사항을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminEvent(Number(id));
            Alert.alert('완료', '삭제되었습니다.', [
              { text: '확인', onPress: () => router.back() },
            ]);
          } catch (e: any) {
            Alert.alert('실패', e?.response?.data?.message || e?.message || '삭제 실패');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'left', 'right']}>
        <View style={{ padding: 20 }}>
          <Text>데이터가 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const createdYmd =
    typeof detail.eventCreatedAt === 'string'
      ? detail.eventCreatedAt.split('T')[0]
      : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel={badgeLabel} studentId="C246120" title="공지사항" showBack />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 내용 카드 */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <Text style={styles.cardTitle}>{detail.title}</Text>
            <Text style={[styles.metaRight, { alignSelf: 'flex-start' }]}>등록 : {createdYmd}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.metaKey}>시작 :</Text>
            <Text style={styles.metaVal}>{detail.eventStartDate || '-'}</Text>
          </View>
          <View style={[styles.row, { marginBottom: 10 }]}>
            <Text style={styles.metaKey}>종료 :</Text>
            <Text style={styles.metaVal}>{detail.eventEndDate || '-'}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.content}>{detail.content}</Text>

          {detail.imageUrls?.length ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.metaKey}>첨부 이미지</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}
              >
                {detail.imageUrls.map((uri) => (
                  <Pressable key={uri} onPress={() => setViewerImage(uri)} style={styles.imageWrap}>
                    <Image source={{ uri }} style={styles.image} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>

        {!isReadonly && (
          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push(`/notice/edit/${detail.eventId}`)}
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.95 }]}
            >
              <Text style={styles.editText}>수정하기</Text>
            </Pressable>

            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.95 }]}
            >
              <Text style={styles.deleteText}>삭제하기</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerImage(null)}>
          <View style={styles.viewerCard}>
            {viewerImage ? <Image source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" /> : null}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    padding: 14,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    color: COLORS.text,
    fontFamily: 'Pretendard-SemiBold',
    flexWrap: 'wrap',
    marginRight: 8,
  },
  metaRight: { color: COLORS.muted, fontFamily: 'Pretendard-Medium', fontSize: 12 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  metaKey: { color: COLORS.muted, fontFamily: 'Pretendard-Medium' },
  metaVal: { color: COLORS.text, fontFamily: 'Pretendard-Medium' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  content: { color: COLORS.text, fontFamily: 'Pretendard-Medium', lineHeight: 22 },
  imageRow: { flexDirection: 'row', gap: 10, marginTop: 8, paddingRight: 4 },
  imageWrap: {
    width: 240,
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: { width: '100%', height: '100%' },

  actions: { marginTop: 12, flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editText: { color: COLORS.primary, fontFamily: 'Pretendard-SemiBold' },
  deleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteText: { color: COLORS.danger, fontFamily: 'Pretendard-SemiBold' },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  viewerCard: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  viewerImage: { width: '100%', height: 480 },
});
