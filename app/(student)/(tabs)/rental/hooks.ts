import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchMemberRentalHistory,
  fetchMemberRentalStatus,
  MemberRentalInfo,
  RentalHistoryInfo,
  RentalStatusCode,
} from '@/src/api/rental';

export type RentalItemSummary = {
  id: string;
  name: string;
  description?: string;
  totalCount: number;
  availableCount: number;
  categoryId: number;
};

export type ActiveRentalStatus = 'IN_PROGRESS' | 'OVERDUE';

export type ActiveRental = {
  id: string;
  itemName: string;
  rentedAt: string;          // ISO 8601 date string
  expectedReturnAt: string;  // ISO 8601 date string
  status: ActiveRentalStatus;
  rentalHistoryId: number | null;
  itemCategoryId: number | null;
};

export type RentalHistoryRecord = {
  id: string;
  itemName: string;
  rentedAt: string;
  expectedReturnAt: string | null;
  returnedAt: string | null;
  status: RentalStatusCode;
};

export type GuidelineSection = {
  id: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').Ionicons.glyphMap;
  title: string;
  lines: string[];
};

const DASHBOARD_PLACEHOLDER: { items: RentalItemSummary[]; blacklistUntil: string | null } = {
  items: [
    {
      id: 'battery',
      name: '보조배터리',
      description: '모든 기종 호환 10,000mAh',
      totalCount: 20,
      availableCount: 18,
      categoryId: 1,
    },
    {
      id: 'umbrella',
      name: '장우산',
      description: '우천 대비 장우산',
      totalCount: 20,
      availableCount: 12,
      categoryId: 2,
    },
    {
      id: 'charger',
      name: '노트북 충전기',
      description: 'USB-C 고속 충전 지원',
      totalCount: 12,
      availableCount: 6,
      categoryId: 3,
    },
  ],
  blacklistUntil: '2025-08-12',
};

const RENTAL_STATUS_PLACEHOLDER: MemberRentalInfo = {
  expectedBlacklistUntil: null,
  items: [],
};

const GUIDELINE_SECTIONS: GuidelineSection[] = [
  {
    id: 'items',
    icon: 'cube-outline',
    title: '대여 가능한 물품',
    lines: [
      '보조배터리(빌트인 케이블 A타입, 8핀, C타입)',
      '노트북 충전기(C타입)',
      '장우산',
    ],
  },
  {
    id: 'place',
    icon: 'location-outline',
    title: '대여 장소',
    lines: ['제4공학관 T동 609호 (컴퓨터공학과 학생회실)'],
  },
  {
    id: 'time',
    icon: 'time-outline',
    title: '대여 및 반납 시간',
    lines: [
      '대여 가능 시간 : 월 ~ 금 11:00 - 17:00',
      '반납 기한 : 대여 다음날 17시까지 (금요일 대여 시 월요일 17시)',
    ],
  },
  {
    id: 'target',
    icon: 'id-card-outline',
    title: '이용 대상 및 준비물',
    lines: [
      '컴퓨터공학과 학생회비 납부자 (컴퓨터공학과, 자율전공 학우)',
      '대여 시 모바일/실물 학생증 제시 후 신분증·학생증·개인 카드 중 1가지 보관',
    ],
  },
];

const GUIDELINE_PENALTIES: string[] = [
  '3일 내 반납 시, 일주일 대여 정지',
  '일주일 내 반납 시, 한 달 대여 정지',
  '그 이상 연체 시, 영구 정지',
];

const RENTAL_HISTORY_PLACEHOLDER: RentalHistoryInfo = {
  items: [],
};

const ensureError = (err: unknown) =>
  err instanceof Error ? err : new Error(typeof err === 'string' ? err : '알 수 없는 오류가 발생했습니다.');

function useRentalStatusQuery() {
  const [data, setData] = useState<MemberRentalInfo>(RENTAL_STATUS_PLACEHOLDER);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMemberRentalStatus();
      setData(result);
    } catch (err) {
      console.warn('[rental] failed to fetch member rental status', err);
      setError(ensureError(err));
    } finally {
      setLoading(false);
    }
  }, [setData]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}

function useRentalHistoryQuery() {
  const [data, setData] = useState<RentalHistoryInfo>(RENTAL_HISTORY_PLACEHOLDER);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMemberRentalHistory();
      setData(result);
    } catch (err) {
      console.warn('[rental] failed to fetch rental history', err);
      setError(ensureError(err));
    } finally {
      setLoading(false);
    }
  }, [setData]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

const toActiveStatus = (status: RentalStatusCode): ActiveRentalStatus | null => {
  if (status === 'OVERDUE') return 'OVERDUE';
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
  return null;
};

export function useRentalDashboard() {
  const status = useRentalStatusQuery();

  return useMemo(
    () => ({
      items: DASHBOARD_PLACEHOLDER.items,
      blacklistUntil: status.data.expectedBlacklistUntil ?? DASHBOARD_PLACEHOLDER.blacklistUntil,
      statusLoading: status.isLoading,
      statusError: status.error,
      refetchStatus: status.refetch,
    }),
    [status],
  );
}

export function useRentalGuidelines() {
  return useMemo(
    () => ({
      sections: GUIDELINE_SECTIONS,
      penalties: GUIDELINE_PENALTIES,
      launchNotice: '본 대여사업은 9/1(월)부터 시행될 예정입니다.',
    }),
    [],
  );
}

export function useMyActiveRentals() {
  const status = useRentalStatusQuery();

  const rentals = useMemo(() => {
    return status.data.items
      .map((item) => {
        const activeStatus = toActiveStatus(item.rentalStatus);
        if (!activeStatus) return null;
        return {
          id: item.rentalHistoryId != null ? String(item.rentalHistoryId) : `${item.itemName}-${item.rentalStartedAt ?? ''}`,
          itemName: item.itemName,
          rentedAt: item.rentalStartedAt ?? '-',
          expectedReturnAt: item.expectedReturnAt ?? '-',
          status: activeStatus,
          rentalHistoryId: item.rentalHistoryId,
          itemCategoryId: item.itemCategoryId,
        };
      })
      .filter((item): item is ActiveRental => Boolean(item));
  }, [status.data.items]);

  return {
    rentals,
    expectedBlacklistUntil: status.data.expectedBlacklistUntil,
    isLoading: status.isLoading,
    error: status.error,
    refetch: status.refetch,
  };
}

export function useRentalHistory() {
  const history = useRentalHistoryQuery();

  const records = useMemo<RentalHistoryRecord[]>(() => {
    return history.data.items.map((item) => ({
      id: item.rentalHistoryId != null ? String(item.rentalHistoryId) : `${item.itemName}-${item.rentalStartedAt ?? ''}`,
      itemName: item.itemName,
      rentedAt: item.rentalStartedAt ?? '-',
      expectedReturnAt: item.expectedReturnAt ?? null,
      returnedAt: item.returnedAt ?? null,
      status: item.rentalStatus,
    }));
  }, [history.data.items]);

  return {
    records,
    isLoading: history.isLoading,
    error: history.error,
    refetch: history.refetch,
  };
}
