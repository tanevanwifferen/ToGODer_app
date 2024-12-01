import { Drawer } from "expo-router/drawer";
import React from "react";
import { Platform } from 'react-native';

import { IconSymbol } from "../../components/ui/IconSymbol";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useSelector } from "react-redux";
import {
  selectDonateOptions,
  selectShowLogin,
} from "../../redux/slices/globalConfigSlice";
import { usePasscode } from "../../hooks/usePasscode";
import { PasscodeModal } from "../../components/passcode/PasscodeModal";
import { LockScreen } from "../../components/passcode/LockScreen";

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const donateOptions = useSelector(selectDonateOptions);
  const showLogin = useSelector(selectShowLogin);
  const { showPasscodeModal, setShowPasscodeModal, isLocked } = usePasscode();

  // Skip passcode check on web platform
  if (Platform.OS !== 'web' && isLocked) {
    return <LockScreen />;
  }

  return (
    <>
      <Drawer
        screenOptions={{
          headerShown: true,
          drawerActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerTintColor: Colors[colorScheme ?? "light"].tint,
          drawerType: "front",
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: "Chat",
            drawerIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: "Settings",
            drawerIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="gear" color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="login"
          options={{
            title: "Profile",
            drawerIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
            drawerItemStyle: { display: showLogin ? "flex" : "none" },
          }}
        />
        <Drawer.Screen
          name="donate"
          options={{
            title: "Support ToGODer",
            drawerIcon: ({ color }: { color: string }) => (
              <IconSymbol size={28} name="heart.fill" color={color} />
            ),
            drawerItemStyle: {
              display: donateOptions.length > 0 ? "flex" : "none",
            },
          }}
        />
      </Drawer>

      {Platform.OS !== 'web' && (
        <PasscodeModal
          visible={showPasscodeModal}
          onClose={() => setShowPasscodeModal(false)}
        />
      )}
    </>
  );
}
