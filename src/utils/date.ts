// src/utils/date.ts
export function toYMD(input: Date | string | undefined): string | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') {
    // 이미 yyyy-MM-dd 형식이면 그대로 리턴
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    // 그 외 문자열은 Date로 파싱 시도
    const d = new Date(input);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split('T')[0];
  }
  // Date 객체
  return input.toISOString().split('T')[0];
}
