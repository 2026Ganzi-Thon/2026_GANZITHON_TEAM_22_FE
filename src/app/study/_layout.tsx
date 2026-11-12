import { Stack } from 'expo-router';
import AppSession from '@/components/layout/AppSession';

export default function Layout() {
  return <AppSession><Stack screenOptions={{ headerShown: false }} /></AppSession>;
}
