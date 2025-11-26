// app/notice/calendar.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDays, endOfMonth, format, startOfMonth } from 'date-fns';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import CouncilHeader from '@/components/CouncilHeader';
import { getAdminEvents, AdminEventInfo } from '../../src/api/adminEvents';

type RNCalDateObject = {
  dateString: string;
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
  pill: '#9FE29F',
};

const EVENT_COLORS = ['#9FE29F', '#5CB2FF', '#FF8B8B', '#FFD166', '#B28BFF', '#4ADE80'];

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
  const { role } = useLocalSearchParams<{ role?: string }>();
  const badgeLabel = role === 'student' ? '학생' : '학생회';
  const isReadonly = role === 'student';

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

  const eventColors = useMemo<Record<string, string>>(
    () =>
      events.reduce<Record<string, string>>((acc, ev, index) => {
        acc[String(ev.eventId)] = EVENT_COLORS[index % EVENT_COLORS.length];
        return acc;
      }, {}),
    [events],
  );

  const markedDates: Marked = useMemo(() => {
    const map: Marked = {};
    events.forEach((ev) => {
      const days = eachDay(ev.eventStartDate, ev.eventEndDate);
      const color = eventColors[String(ev.eventId)] || COLORS.pill;
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
    if (selected) {
      map[selected] = {
        ...(map[selected] || {}),
        selected: true,
        selectedColor: '#E8EDFF',
        selectedTextColor: COLORS.text,
      };
    }
    return map;
  }, [eventColors, events, selected]);

  const filtered = useMemo(() => {
    if (!selected) return [];
    return events.filter(
      (ev) => ev.eventStartDate <= selected && selected <= ev.eventEndDate
    );
  }, [events, selected]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top', 'left', 'right']}>
      <CouncilHeader badgeLabel={badgeLabel} studentId="C246120" title="달력" showBack />

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
                onPress={() =>
                  router.push({
                    pathname: '/notice/[id]',
                    params: {
                      id: String(ev.eventId),
                      ...(isReadonly ? { readonly: '1', role: 'student' } : {}),
                    },
                  })
                }
                style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.95 }]}
              >
                <View style={[styles.dot, { backgroundColor: eventColors[String(ev.eventId)] || COLORS.pill }]} />
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
