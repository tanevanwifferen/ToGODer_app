import { Drawer } from "expo-router/drawer";
import React from "react";

import { IconSymbol } from "../../components/ui/IconSymbol";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { useSelector } from "react-redux";
import { selectDonateOptions, selectShowLogin } from "../../redux/slices/globalConfigSlice";
import { usePasscode } from "../../hooks/usePasscode";
import { PasscodeModal } from "../../components/passcode/PasscodeModal";
import { LockScreen } from "../../components/passcode/LockScreen";

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const donateOptions = useSelector(selectDonateOptions);
  const showLogin = useSelector(selectShowLogin);
  const { showPasscodeModal, setShowPasscodeModal, isLocked } = usePasscode();

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <>
      <Drawer
        screenOptions={{
          headerShown: true,
          drawerActiveTintColor: Colors[colorScheme ?? "light"].tint,
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
        {showLogin && (
          <Drawer.Screen
            name="login"
            options={{
              title: "Profile",
              drawerIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="person.fill" color={color} />
              ),
            }}
          />
        )}
        {donateOptions.length > 0 && (
          <Drawer.Screen
            name="donate"
            options={{
              title: "Support ToGODer",
              drawerIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="heart.fill" color={color} />
              ),
            }}
          />
        )}
      </Drawer>

      <PasscodeModal
        visible={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
      />
    </>
  );
}
