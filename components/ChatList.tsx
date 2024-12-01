import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Alert, Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { addChat, deleteChat, setCurrentChat, Chat } from "../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import Animated, { 
  FadeIn, 
  SlideInRight,
  withTiming,
  useAnimatedStyle,
  interpolate,
  SharedValue
} from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { selectChats, selectChatRequests } from "../redux/slices/chatSelectors";
import CustomAlert from "./ui/CustomAlert";

export function ChatList() {
  const dispatch = useDispatch();
  const chatRequests = useSelector(selectChatRequests);
  const regularChats = useSelector(selectChats);

  const handleCreateNewChat = () => {
    const newChatId = uuidv4();
    dispatch(addChat({
      id: newChatId,
      title: null,
      messages: [],
    }));
    dispatch(setCurrentChat(newChatId));
  };

  const handleLongPress = (chatId: string, title: string | null | undefined) => {
    console.log("handle long press");
    CustomAlert.alert(
      "Delete Chat",
      `Are you sure you want to delete "${title || 'Untitled Chat'}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => dispatch(deleteChat(chatId))
        }
      ]
    );
  };

  const renderRightActions = (item: Chat, progress: SharedValue<number>) => {
    const animatedStyle = useAnimatedStyle(() => {
      const translateX = interpolate(
        progress.value,
        [0, 1],
        [100, 0]
      );

      return {
        transform: [{ translateX }]
      };
    });

    return (
      <Animated.View style={[styles.deleteAction, animatedStyle]}>
        <TouchableOpacity 
          onPress={() => handleLongPress(item.id, item.title)}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderChatItem = ({ item, isRequest }: { item: Chat; isRequest?: boolean }) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.chatItemContainer}>
          <TouchableOpacity
            style={[styles.chatItem, isRequest && styles.requestItem]}
            onPress={() => dispatch(setCurrentChat(item.id))}
          >
            <Text style={[styles.chatTitle, isRequest && styles.requestTitle]}>
              {isRequest ? '🔔 ' : ''}{item.title || 'Untitled Chat'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.webDeleteButton}
            onPress={() => handleLongPress(item.id, item.title)}
          >
            <Text style={styles.webDeleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <Swipeable
        renderRightActions={(e) => renderRightActions(item, e)}
        rightThreshold={0.3}
        onSwipeableOpen={(direction: "left"|"right") => {
          if (direction === 'right') {
            handleLongPress(item.id, item.title);
          }
        }}
      >
        <Animated.View entering={SlideInRight}>
          <TouchableOpacity
            style={[styles.chatItem, isRequest && styles.requestItem]}
            onPress={() => dispatch(setCurrentChat(item.id))}
          >
            <Text style={[styles.chatTitle, isRequest && styles.requestTitle]}>
              {isRequest ? '🔔 ' : ''}{item.title || 'Untitled Chat'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleCreateNewChat}
        >
          <Text style={styles.newChatButtonText}>+ New Chat</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={[...chatRequests, ...regularChats]}
        renderItem={({ item, index }) => renderChatItem({ 
          item, 
          isRequest: index < chatRequests.length 
        })}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        ListHeaderComponent={() => chatRequests.length > 0 ? renderSectionHeader('Requests') : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  chatItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  requestItem: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  chatTitle: {
    fontSize: 16,
  },
  requestTitle: {
    color: '#f57c00',
    fontWeight: '500',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
    borderRadius: 8,
  },
  deleteActionText: {
    color: 'white',
    fontWeight: '600',
    padding: 20,
  },
  sectionHeader: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  swipeableContainer: {
    marginBottom: 12,
  },
  chatItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  webDeleteButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webDeleteButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
});
