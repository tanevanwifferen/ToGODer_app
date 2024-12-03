import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";

interface ChatListHeaderProps {
  onNewChat: () => void;
}

export function ChatListHeader({ onNewChat }: ChatListHeaderProps) {
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
      <Text style={[styles.headerTitle, { color: theme.text }]}>Chats</Text>
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
  headerTitle: {
    fontSize: 24,
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
