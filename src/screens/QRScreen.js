// src/screens/QRScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function QRScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Screen</Text>
      <Text>QR 기능(스캔/생성)을 추후 추가할 예정입니다.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
});
