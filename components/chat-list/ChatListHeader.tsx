import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";

interface ChatListHeaderProps {
  onNewChat: () => void;
  projectName?: string | null;
  onClearProjectFilter?: () => void;
}

export function ChatListHeader({ onNewChat, projectName, onClearProjectFilter }: ChatListHeaderProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: colorScheme === "dark" ? "#2D2D2D" : "#e0e0e0",
        },
      ]}
    >
      <View style={styles.titleContainer}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Chats</Text>
        {projectName && (
          <TouchableOpacity
            style={[
              styles.projectBadge,
              { backgroundColor: colorScheme === "dark" ? "#3D3D3D" : "#e8e8e8" },
            ]}
            onPress={onClearProjectFilter}
          >
            <Text style={[styles.projectBadgeText, { color: theme.tint }]}>
              {projectName}
            </Text>
            <Text style={[styles.clearIcon, { color: theme.text + "99" }]}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.newChatButton, { backgroundColor: theme.tint }]}
        onPress={onNewChat}
      >
        <Text
          style={[
            styles.newChatButtonText,
            { color: colorScheme === "dark" ? "#000" : "#fff" },
          ]}
        >
          + New Chat
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  projectBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  clearIcon: {
    fontSize: 16,
    fontWeight: "bold",
  },
  newChatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
