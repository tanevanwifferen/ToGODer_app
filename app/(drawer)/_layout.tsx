import { Drawer } from 'expo-router/drawer';
import React from 'react';

import { IconSymbol } from '../../components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        drawerType: 'front',
      }}>
      <Drawer.Screen
        name="index"
        options={{
          title: 'Chat',
          drawerIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
      <Drawer.Screen
        name="login"
        options={{
          title: 'Login',
          drawerIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Drawer>
  );
}
