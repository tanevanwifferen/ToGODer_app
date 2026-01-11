import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Colors } from "../../constants/Colors";

export type TabType = "chats" | "artifacts";

interface ProjectDetailsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  chatCount: number;
  artifactCount: number;
}

export function ProjectDetailsTabs({
  activeTab,
  onTabChange,
  chatCount,
  artifactCount,
}: ProjectDetailsTabsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "chats", label: "Chats", count: chatCount },
    { key: "artifacts", label: "Artifacts", count: artifactCount },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#2D2D2D" : "#f5f5f5" },
      ]}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && [
              styles.activeTab,
              { backgroundColor: theme.tint },
            ],
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab.key ? "white" : theme.text },
            ]}
          >
            {tab.label}
          </Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  activeTab === tab.key ? "rgba(255,255,255,0.3)" : theme.tint + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: activeTab === tab.key ? "white" : theme.tint },
              ]}
            >
              {tab.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
