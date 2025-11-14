import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import RentalQrScanner from '@/src/screens/RentalQrScanner';

export default function RentalCategoryScanScreen() {
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const rawName = Array.isArray(params.categoryName) ? params.categoryName[0] : params.categoryName;

  const title = useMemo(() => {
    const normalized = rawName?.trim();
    if (normalized && normalized.length > 0) {
      return `${normalized} 대여 QR 스캔`;
    }
    return '대여 QR 스캔';
  }, [rawName]);

  const instruction = useMemo(() => {
    const normalized = rawName?.trim();
    if (normalized && normalized.length > 0) {
      return `${normalized}을(를) 대여하려면 학생의 QR을 스캔하세요.`;
    }
    return undefined;
  }, [rawName]);

  return (
    <RentalQrScanner
      title={title}
      showBack
      backFallbackHref="/(council)/rental"
      showHeaderRefresh
      instruction={instruction}
    />
  );
}
