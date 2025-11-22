# 회비영 (HeavyYoung)

학생회와 재학생이 공지, 자산, 인증 업무를 함께 처리하는 Expo Router 기반 모바일 앱입니다. 학생회 전용 탭과 일반 학생 탭을 분리해 필요한 기능만 쉽게 접근할 수 있도록 구성했고, 공지·자산·QR·설정 등 핵심 플로우를 우선 구현했습니다.

## Tech Stack
- Expo 54, React Native 0.81, React 19
- Expo Router 6, Safe Area, Vector Icons
- Expo Camera (QR 스캐너), Expo SecureStore (세션)
- Axios 기반 API 레이어, date-fns, react-native-calendars
- TypeScript, Expo ESLint preset

## 주요 기능
- 역할별 내비게이션: `(council)`과 `(student)` 스택을 분리하고 `HBTabBar`로 가운데 플로팅 탭을 제공
- 공지 관리: 공지 목록, 상세 보기, 작성, 수정, 삭제, 달력 필터링까지 하나의 흐름으로 연결
- 공지 달력: 월 단위 API 조회, 기간형 이벤트를 multi-period 마킹으로 표시, 날짜별 공지 리스트 제공
- QR 인증: Expo Camera로 권한 요청 → 스캔 → 승인/거부 시나리오를 시각적으로 안내
- 자산 대여: 카테고리별 대여/반납 처리, 수량 조정 모달, 상세 관리 화면 진입
- 설정 허브: 역할 전환, 가이드, 비밀번호 변경 등 추가 화면으로 확장 가능한 메뉴 제공
- 디자인 토큰: `src/design/colors.ts`, `src/design/typography.ts`로 색상·타이포 일관성 유지

## 역할별/탭별 기능 상세
학생회(관리자)와 학생 뷰는 동일한 탭 5개(`qr`, `rental`, `index`, `locker`, `mypage`)를 공유하며, `HBTabBar`가 순서/아이콘/중앙 플로팅 버튼을 단일 소스로 관리합니다. 아래는 탭별 상세 동작과 주요 화면입니다.

### 학생회 (관리자)
- QR (`app/(council)/qr.tsx`)
  - 학생 앱 QR 스캔 → 학생회비 납부 여부 검증(`src/screens/StudentFeeQrScanner`), 승인/미승인/에러 상태별 음성·배지·버튼 라벨 대응
- 물품 (`app/(council)/rental/*`)
  - 대시보드(`rental/index.tsx`): 카테고리별 총수량/대여중 수량, 대여/반납 액션 진입, 물품 관리 모달
  - 스캔(`rental/scan.tsx`, `src/screens/RentalQrScanner.tsx`): 학생 QR로 대여 처리, 에러 코드별 친절 메시지
  - 반납 스캔(`rental/return.tsx`, `src/screens/ReturnQrScanner.tsx`): 학생 QR로 즉시 반납 처리
  - 내역/필터(`rental/overview.tsx`): 상태(대여중/연체/반납완료/취소), 카테고리, 검색어, 특정 날짜 필터 + 수동 반납 처리
  - 종류 추가(`rental/add.tsx`): 새 카테고리 생성 후 대시보드로 리다이렉트
- 달력/공지 (`app/(council)/index.tsx`, `app/notice/*`)
  - 공지 리스트 + 작성/수정/삭제, `notice/calendar.tsx`에서 월별 이벤트 멀티 마킹, 상세/작성/수정 라우트 연결
- 사물함 (`app/(council)/locker/*`)
  - 대시보드(`locker/index.tsx`): 구역별 사용중/가능/불가 수량, 상태 변경(사용 가능/사용중/고장), 학기 일괄 반납
  - 신청 일정 관리(`locker/applications.tsx`): 일정 생성, 신청 마감, 자동 배정, 신청자 목록·신청 시간 표시
  - 배정 내역(`locker/history.tsx`): 학기 선택 후 구역별 배정 테이블 뷰
- 마이/설정 (`app/(council)/mypage.tsx`, `app/settings/*`)
  - 학생회 인원 관리, 비밀번호 변경, 가이드, 로그아웃/탈퇴, 학생 뷰로 전환 스위치 (`settings-home.tsx` 내부)

### 학생
- QR (`app/(student)/(tabs)/qr.tsx`)
  - 학생회비 납부 상태를 포함한 QR 발급(30초 만료 타이머), 만료 오버레이/재발급, 미납 안내 토스트
- 물품 (`app/(student)/(tabs)/rental/*`)
  - 대여 대시보드(`rental/index.tsx`): 대여 가능 품목 목록, 잔여 수량, 블랙리스트/경고 안내
  - 대여 QR 발급(`rent-item.tsx`): 카테고리별 QR 생성, 학생회비 납부 배지, 만료 타이머
  - 반납 QR 발급(`return-item.tsx`): 활성 대여 목록에서 선택 후 QR 발급, 연체 배지/메타 표시
  - 내 대여 현황(`my-status.tsx`), 전체 대여 내역(`rental-history.tsx`), 안내(`guides.tsx`)
- 달력/공지 (`app/(student)/(tabs)/index.tsx`, `app/notice/*`)
  - 공지 리스트/상세 읽기, 달력 진입(작성·수정은 비활성)
- 사물함 (`app/(student)/(tabs)/locker.tsx`)
  - 나의 사물함 상태/배정 정보, 신청 버튼(중복 신청 방지), 구역별 현황 모달에서 상태·배정자 정보 확인
- 마이/설정 (`app/(student)/(tabs)/mypage.tsx`, `app/(student)/settings/*`)
  - 내 대여/사물함/블랙리스트/학생회비 상태를 한 번에 확인, 비밀번호 변경, 알림/가이드, 로그아웃 등

## 공통 컴포넌트/토대
- `HBTabBar`(`src/components/HBTabBar.tsx`): 두 스택의 탭 순서/아이콘/레이블 중앙 관리, 중앙 플로팅 버튼 강조
- `CouncilHeader`: 배지/학번/타이틀/백버튼/우측 액션 공통 헤더
- 디자인 토큰: `src/design/colors.ts`, `src/design/typography.ts` (Pretendard 폰트 기준)
- API 레이어: `src/api/*` 도메인 서비스, Axios 인터셉터, 플랫폼별 기본 URL 분기

## 공통 컴포넌트/토대
- `HBTabBar`: 학생회·학생 탭바를 단일 소스에서 관리, 중앙 플로팅 버튼 포함
- `CouncilHeader`: 상단 헤더(배지/학번/뒤로가기/우측 액션) 공통화
- 디자인 토큰: `src/design/colors.ts`, `src/design/typography.ts`
- API 레이어: `src/api/*` 도메인 서비스와 공통 인터셉터, 플랫폼별 기본 URL 분기

## 디렉터리 맵
```text
app/
  _layout.tsx            # 역할별 스택 정의
  (council)/             # 학생회 탭: QR, 대여, 사물함, 마이
  (student)/             # 학생 탭: 같은 탭 구성을 학생 전용으로
  notice/                # 공지 상세, 작성, 수정, 달력
  settings/              # 설정 및 부가 화면
  auth/                  # 로그인 흐름(추가 예정)
components/              # 글로벌 UI (CouncilHeader 등)
src/
  api/                   # axios client와 도메인별 서비스
  auth/                  # AuthProvider (SecureStore 연동)
  components/            # 기능 위젯 (HBTabBar 등)
  design/                # 색상/타이포 토큰
  screens/               # 상태/비즈니스 훅 (필요 시 공유)
  utils/                 # 순수 헬퍼 (date 포맷 등)
assets/                  # 이미지, 로고
```

## API 연동
- `src/api/client.ts` 에서 iOS/Android 환경별 기본 URL을 분기합니다. 현재는 내부 개발용 IP(`13.209.220.192:8080`, `10.0.2.2:8080`)가 설정되어 있으므로 배포 시 `.env` 또는 Expo Config Plugin으로 분리하세요.
- `adminEvents.ts`, `event.ts`는 서버의 `ApiResponse<T>` 래핑을 전제로 하며 목록/상세/등록/수정/삭제를 담당합니다.
- 에러는 공통 인터셉터에서 콘솔 경고로 로깅하고, 화면에서는 Alert로 사용자에게 안내합니다.

## 시작하기
```bash
npm install
npm run start           # Metro + Expo Router
# or
npm run android         # 안드로이드 에뮬레이터
npm run ios             # iOS 시뮬레이터
npm run web             # 웹 미리보기
```

- ESLint: `npm run lint` (Expo preset, 정렬/미사용 규칙 필수 준수)
- 캐시 초기화: `npm run start -- --clear`
- 샘플 라우트 리셋: `npm run reset-project` (협업 중에는 사용 주의)

## 개발 메모
- Pretendard 폰트를 전제로 스타일이 작성되어 있으므로 앱 시작 시 `expo-font` 로드 로직을 유지해야 합니다.
- QR 기능은 기기 권한 상태에 따라 UI가 달라지므로 실제 디바이스에서 한 번 이상 검증하세요.
- Calendar 화면은 월 전환 시 `getAdminEvents`를 다시 호출합니다. 서버 쿼리 비용을 고려해 페이지네이션/캐싱 전략을 추후 협의하세요.
- SecureStore에 역할(role)만 보관 중이며 토큰 저장/검증은 TODO로 남아 있습니다.
- 자동 테스트는 아직 없으므로 머지 전 `npm run start` 후 안드로이드·iOS·웹에서 핵심 플로우(공지 CRUD, 달력, QR, 대여, 설정)를 수동 점검해 주세요.

## 향후 확장 아이디어
- 학생/학생회 공통으로 쓰는 API 응답 캐싱과 에러 처리 토스트화
- Rental/Locker 데이터의 서버 연동 및 실시간 동기화
- AuthProvider에 실제 로그인, 토큰 갱신, 가드 라우팅 추가
- Settings 하위 화면(비밀번호 변경, 역할 전환)에서 실서비스 API 연동
