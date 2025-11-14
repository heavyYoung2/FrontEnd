import React from 'react';
import ReturnQrScanner from '@/src/screens/ReturnQrScanner';

export default function RentalReturnScanScreen() {
  return (
    <ReturnQrScanner
      title="반납 QR 스캔"
      showBack
      backFallbackHref="/(council)/rental"
      showHeaderRefresh
      instruction="학생 QR을 스캔하면 반납이 즉시 처리됩니다."
    />
  );
}
