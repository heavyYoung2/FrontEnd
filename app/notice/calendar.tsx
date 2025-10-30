// app/notice/calendar.tsx
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
import { useFocusEffect } from '@react-navigation/native';

type RNCalDateObject = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

import { Calendar } from 'react-native-calendars';
import { addDays, endOfMonth, format, startOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAdminEvents, AdminEventInfo } from '../../src/api/adminEvents';

const COLORS = {
  primary: '#2E46F0',
  text: '#111827',
  muted: '#6F7680',
  border: '#E6E8EE',
  surface: '#FFFFFF',
  bg: '#F5F7FA',
  pill: '#9FE29F',
};

type Marked = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    periods?: { startingDay?: boolean; endingDay?: boolean; color: string }[];
  };
};

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

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
  const [selected, setSelected] = useState<string>(ymd(new Date()));
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<AdminEventInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // 최초 로딩
  React.useEffect(() => { load(month); }, [load, month]);

  // ✅ 이게 핵심: 화면이 다시 보일 때마다 새로고침
  useFocusEffect(
    React.useCallback(() => {
      load(month);
      return undefined;
    }, [load, month])
  );

  const markedDates: Marked = useMemo(() => {
    const map: Marked = {};
    events.forEach((ev) => {
      const days = eachDay(ev.eventStartDate, ev.eventEndDate);
      days.forEach((d, i) => {
        const isStart = i === 0;
        const isEnd = i === days.length - 1;
        if (!map[d]) map[d] = { periods: [] };
        map[d].periods!.push({
          color: COLORS.pill,
          ...(isStart ? { startingDay: true } : {}),
          ...(isEnd ? { endingDay: true } : {}),
        });
      });
    });
    if (selected) {
      map[selected] = {
        ...(map[selected] || {}),
        selected: true,
        selectedColor: '#E8EDFF',
        selectedTextColor: COLORS.text,
      };
    }
    return map;
  }, [events, selected]);

  const filtered = useMemo(() => {
    if (!selected) return [];
    return events.filter(
      (ev) => ev.eventStartDate <= selected && selected <= ev.eventEndDate
    );
  }, [events, selected]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* 최상단: 학생회 태그 + 학번 */}
      <View style={styles.identityWrap}>
        <View style={styles.identity}>
          <View style={styles.badge}><Text style={styles.badgeText}>학생회</Text></View>
          <Text style={styles.studentId}>C123456</Text>
        </View>
      </View>

      {/* 헤더: 뒤로가기 + 중앙 타이틀 */}
      <View style={styles.headerWrap}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>달력</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* 달력 카드 */}
      <View style={styles.card}>
        <Calendar
          markingType="multi-period"
          markedDates={markedDates}
          current={ymd(month)}
          onDayPress={(d: RNCalDateObject) => {
            setSelected(d.dateString);
            const clickedMonth = new Date(d.year, d.month - 1, 1);
            if (
              clickedMonth.getMonth() !== month.getMonth() ||
              clickedMonth.getFullYear() !== month.getFullYear()
            ) {
              setMonth(clickedMonth);
            }
          }}
          onMonthChange={(m: RNCalDateObject) => {
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

      {/* 선택된 날짜의 리스트 */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
        <View style={styles.listCard}>
          <Text style={styles.listHeader}>
            {selected ? format(new Date(selected), 'yyyy년 M월 d일') : '날짜 선택'}
          </Text>

          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : error ? (
            <Text style={{ color: '#DC2626', paddingVertical: 12 }}>{error}</Text>
          ) : filtered.length === 0 ? (
            <Text style={{ color: COLORS.muted, paddingVertical: 12 }}>
              공지사항이 없습니다.
            </Text>
          ) : (
            filtered.map((ev) => (
              <Pressable
                key={ev.eventId}
                onPress={() => router.push(`/notice/${ev.eventId}`)}
                style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.95 }]}
              >
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{ev.title}</Text>
                  <Text style={styles.itemSub}>
                    {ev.eventStartDate} ~ {ev.eventEndDate}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  identityWrap: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  badge: { backgroundColor: COLORS.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Pretendard-SemiBold' },
  studentId: { color: COLORS.text, fontSize: 14, fontFamily: 'Pretendard-Medium' },

  headerWrap: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 18, fontFamily: 'Pretendard-SemiBold', textAlign: 'center' },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },

  listCard: {
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 12,
  },
  listHeader: { fontFamily: 'Pretendard-SemiBold', color: COLORS.text, fontSize: 16, marginBottom: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.pill },
  itemTitle: { color: COLORS.text, fontFamily: 'Pretendard-SemiBold', fontSize: 15, marginBottom: 2 },
  itemSub: { color: COLORS.muted, fontFamily: 'Pretendard-Medium', fontSize: 12 },
});