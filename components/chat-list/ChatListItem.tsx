import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  useColorScheme,
} from "react-native";
import { Colors } from "../../constants/Colors";
import Animated, {
  SlideInRight,
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Chat } from "../../redux/slices/chatsSlice";

const formatLastUpdate = (timestamp?: number) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // Same day
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // Different year
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

interface ChatListItemProps {
  item: Chat;
  isRequest?: boolean;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string, title: string | null | undefined) => void;
}

export function ChatListItem({
  item,
  isRequest,
  onSelect,
  onDelete,
}: ChatListItemProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const renderRightActions = (progress: SharedValue<number>) => {
    const animatedStyle = useAnimatedStyle(() => {
      const translateX = interpolate(progress.value, [0, 1], [100, 0]);
      return {
        transform: [{ translateX }],
      };
    });

    return (
      <Animated.View style={[styles.deleteAction, animatedStyle]}>
        <TouchableOpacity
          onPress={() => onDelete(item.id, item.title)}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.chatItemContainer}>
        <TouchableOpacity
          style={[
            styles.chatItem,
            {
              backgroundColor: colorScheme === "dark" ? "#2D2D2D" : "#f5f5f5",
              flex: 1,
            },
            isRequest && [
              styles.requestItem,
              {
                backgroundColor: colorScheme === "dark" ? "#2D2015" : "#fff3e0",
                borderColor: colorScheme === "dark" ? "#8B5E3C" : "#ffb74d",
              },
            ],
          ]}
          onPress={() => onSelect(item.id)}
        >
          <View style={styles.chatItemContent}>
            <Text
              style={[
                styles.chatTitle,
                { color: theme.text },
                isRequest && [
                  styles.requestTitle,
                  { color: colorScheme === "dark" ? "#FFB74D" : "#f57c00" },
                ],
              ]}
            >
              {isRequest ? "🔔 " : ""}
              {item.title || "Untitled Chat"}
            </Text>
            <Text style={[styles.timestamp, { color: theme.text + '99' }]}>
              {formatLastUpdate(item.last_update)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.webDeleteButton}
          onPress={() => onDelete(item.id, item.title)}
        >
          <Text style={styles.webDeleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Swipeable
      renderRightActions={(e) => renderRightActions(e)}
      rightThreshold={0.3}
      onSwipeableOpen={(direction: "left" | "right") => {
        if (direction === "right") {
          onDelete(item.id, item.title);
        }
      }}
    >
      <Animated.View entering={SlideInRight}>
        <TouchableOpacity
          style={[
            styles.chatItem,
            {
              backgroundColor: colorScheme === "dark" ? "#2D2D2D" : "#f5f5f5",
            },
            isRequest && [
              styles.requestItem,
              {
                backgroundColor: colorScheme === "dark" ? "#2D2015" : "#fff3e0",
                borderColor: colorScheme === "dark" ? "#8B5E3C" : "#ffb74d",
              },
            ],
          ]}
          onPress={() => onSelect(item.id)}
        >
          <View style={styles.chatItemContent}>
            <Text
              style={[
                styles.chatTitle,
                { color: theme.text },
                isRequest && [
                  styles.requestTitle,
                  { color: colorScheme === "dark" ? "#FFB74D" : "#f57c00" },
                ],
              ]}
            >
              {isRequest ? "🔔 " : ""}
              {item.title || "Untitled Chat"}
            </Text>
            <Text style={[styles.timestamp, { color: theme.text + '99' }]}>
              {formatLastUpdate(item.last_update)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  chatItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  requestItem: {
    borderWidth: 1,
  },
  chatTitle: {
    fontSize: 16,
  },
  requestTitle: {
    fontWeight: "500",
  },
  deleteAction: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "flex-end",
    width: 100,
    borderRadius: 8,
  },
  deleteActionText: {
    color: "white",
    fontWeight: "600",
    padding: 20,
  },
  chatItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  webDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  webDeleteButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 24,
  },
  chatItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
});
