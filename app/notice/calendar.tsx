import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { addDays, endOfMonth, format, startOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAdminEvents, AdminEventInfo } from '../../src/api/adminEvents';

type DateObject = {
  dateString: string; // "2025-10-01"
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
  pill: '#A7D7A7', // 달력 녹색 바 색
};

type Marked = {
  [date: string]: {
    periods?: { startingDay?: boolean; endingDay?: boolean; color: string }[];
  };
};

function ymd(d: Date) { return format(d, 'yyyy-MM-dd'); }

/** 날짜 문자열 ymd 사이의 모든 날짜를 배열로 반환 */
function eachDay(startYmd: string, endYmd: string): string[] {
  const s = new Date(startYmd);
  const e = new Date(endYmd);
  const out: string[] = [];
  for (let cur = s; cur <= e; cur = addDays(cur, 1)) out.push(ymd(cur));
  return out;
}

export default function CouncilCalendarScreen() {
  const router = useRouter();

  const [month, setMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<AdminEventInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** 월이 바뀔 때마다 서버에서 해당 월 범위로 조회 */
  const load = useCallback(async (base: Date) => {
    try {
      setLoading(true);
      setError(null);
      const from = ymd(startOfMonth(base));
      const to = ymd(endOfMonth(base));
      const list = await getAdminEvents({ from, to });
      setEvents(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || '요청 실패');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(month); }, [load, month]);

  /** react-native-calendars 멀티-기간 마킹 데이터 구성 */
  const markedDates: Marked = useMemo(() => {
    const map: Marked = {};
    events.forEach((ev, idx) => {
      const color = COLORS.pill; // 필요하면 인덱스로 색 다양화
      const days = eachDay(ev.eventStartDate, ev.eventEndDate);
      days.forEach((d, i) => {
        const isStart = i === 0;
        const isEnd = i === days.length - 1;
        if (!map[d]) map[d] = { periods: [] };
        map[d].periods!.push({
          color,
          ...(isStart ? { startingDay: true } : {}),
          ...(isEnd ? { endingDay: true } : {}),
        });
      });
    });
    return map;
  }, [events]);

  const monthStr = useMemo(() => format(month, 'yyyy년 MM월'), [month]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* 상단 헤더 (공통: 학생회 뱃지 + 학번 + 타이틀 + 뒤로가기) */}
      <View style={styles.headerWrap}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingRight: 4 }}>
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </Pressable>
          <Text style={styles.title}>달력</Text>
        </View>

        <View style={styles.identity}>
          <View style={styles.badge}><Text style={styles.badgeText}>학생회</Text></View>
          <Text style={styles.studentId}>C123456</Text>
        </View>
      </View>

      {/* 달력 카드 */}
      <View style={styles.card}>
        <Calendar
          // 여러 기간을 같은 날짜에 겹칠 수 있게
          markingType="multi-period"
          markedDates={markedDates}
          current={ymd(month)}
          onMonthChange={(m: DateObject) => {
            const d = new Date(m.year, m.month - 1, 1);
            setMonth(d);
          }}
          theme={{
            textDayFontFamily: 'Pretendard-Medium',
            textMonthFontFamily: 'Pretendard-SemiBold',
            textDayHeaderFontFamily: 'Pretendard-Medium',
            todayTextColor: COLORS.primary,
            monthTextColor: COLORS.text,
            arrowColor: COLORS.text,
          }}
        />
      </View>

      {/* 목록 */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
        <View style={styles.listCard}>
          {loading ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : error ? (
            <Text style={{ color: '#DC2626' }}>{error}</Text>
          ) : events.length === 0 ? (
            <Text style={{ color: COLORS.muted, padding: 12 }}>해당 월에 등록된 일정이 없습니다.</Text>
          ) : (
            events.map((ev) => (
              <View key={ev.eventId} style={styles.itemRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{ev.title}</Text>
                  <Text style={styles.itemSub}>{`${ev.eventStartDate} ~ ${ev.eventEndDate}`}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerWrap: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  title: { textAlign: 'center', paddingVertical: 8, color: COLORS.text, fontSize: 18, fontFamily: 'Pretendard-SemiBold' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },

  card: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, overflow: 'hidden',
  },

  listCard: {
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    padding: 12,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9FE29F' },
  itemTitle: { color: COLORS.text, fontFamily: 'Pretendard-SemiBold', fontSize: 15, marginBottom: 2 },
  itemSub: { color: COLORS.muted, fontFamily: 'Pretendard-Medium', fontSize: 12 },
});
