import { useMemo } from 'react';

export type RentalItemSummary = {
  id: string;
  name: string;
  description?: string;
  totalCount: number;
  availableCount: number;
};

export type ActiveRentalStatus = 'IN_PROGRESS' | 'OVERDUE';

export type ActiveRental = {
  id: string;
  itemName: string;
  rentedAt: string;          // ISO 8601 date string
  expectedReturnAt: string;  // ISO 8601 date string
  status: ActiveRentalStatus;
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
    },
    {
      id: 'umbrella',
      name: '장우산',
      description: '우천 대비 장우산',
      totalCount: 20,
      availableCount: 12,
    },
    {
      id: 'charger',
      name: '노트북 충전기',
      description: 'USB-C 고속 충전 지원',
      totalCount: 12,
      availableCount: 6,
    },
  ],
  blacklistUntil: '2025-08-12',
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

const ACTIVE_RENTAL_PLACEHOLDER: ActiveRental[] = [
  {
    id: 'umbrella-20250712',
    itemName: '장우산',
    rentedAt: '2025-07-12',
    expectedReturnAt: '2025-07-12',
    status: 'OVERDUE',
  },
  {
    id: 'battery-20250712',
    itemName: '보조배터리',
    rentedAt: '2025-07-12',
    expectedReturnAt: '2025-07-12',
    status: 'IN_PROGRESS',
  },
];

export function useRentalDashboard() {
  return useMemo(
    () => ({
      items: DASHBOARD_PLACEHOLDER.items,
      blacklistUntil: DASHBOARD_PLACEHOLDER.blacklistUntil,
    }),
    [],
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
  return useMemo(() => ACTIVE_RENTAL_PLACEHOLDER, []);
}
