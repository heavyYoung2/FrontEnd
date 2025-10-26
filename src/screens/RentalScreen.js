// src/screens/RentalScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RentalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rental Screen</Text>
      <Text>대여 목록, 신청/반납 플로우 등을 추가하세요.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
});
