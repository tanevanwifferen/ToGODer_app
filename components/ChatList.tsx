import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Alert, Platform, useColorScheme } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { addChat, deleteChat, setCurrentChat, Chat } from "../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { Colors } from '../constants/Colors';
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

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
            style={[
              styles.chatItem,
              {
                backgroundColor: colorScheme === 'dark' ? '#2D2D2D' : '#f5f5f5',
                flex: 1
              },
              isRequest && [
                styles.requestItem,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2D2015' : '#fff3e0',
                  borderColor: colorScheme === 'dark' ? '#8B5E3C' : '#ffb74d'
                }
              ]
            ]}
            onPress={() => dispatch(setCurrentChat(item.id))}
          >
            <Text style={[
              styles.chatTitle,
              { color: theme.text },
              isRequest && [
                styles.requestTitle,
                { color: colorScheme === 'dark' ? '#FFB74D' : '#f57c00' }
              ]
            ]}>
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
            style={[
              styles.chatItem,
              {
                backgroundColor: colorScheme === 'dark' ? '#2D2D2D' : '#f5f5f5'
              },
              isRequest && [
                styles.requestItem,
                {
                  backgroundColor: colorScheme === 'dark' ? '#2D2015' : '#fff3e0',
                  borderColor: colorScheme === 'dark' ? '#8B5E3C' : '#ffb74d'
                }
              ]
            ]}
            onPress={() => dispatch(setCurrentChat(item.id))}
          >
            <Text style={[
              styles.chatTitle,
              { color: theme.text },
              isRequest && [
                styles.requestTitle,
                { color: colorScheme === 'dark' ? '#FFB74D' : '#f57c00' }
              ]
            ]}>
              {isRequest ? '🔔 ' : ''}{item.title || 'Untitled Chat'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: colorScheme === 'dark' ? '#9BA1A6' : '#666' }]}>
        {title}
      </Text>
    </View>
  );

  const containerStyle = Platform.OS === 'web' ? styles.webContainer : styles.container;
  const contentStyle = Platform.OS === 'web' ? styles.webContent : undefined;

  return (
    <SafeAreaView style={[containerStyle, { backgroundColor: theme.background }]}>
      <View style={[contentStyle]}>
        <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#2D2D2D' : '#e0e0e0' }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Chats</Text>
          <TouchableOpacity
            style={[styles.newChatButton, { backgroundColor: theme.tint }]}
            onPress={handleCreateNewChat}
          >
            <Text style={[styles.newChatButtonText, { color: colorScheme === 'dark' ? '#000' : '#fff' }]}>
              + New Chat
            </Text>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    alignItems: 'center',
  },
  webContent: {
    width: '100%',
    maxWidth: 600,
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
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
    textTransform: 'uppercase',
  },
  swipeableContainer: {
    marginBottom: 12,
  },
  chatItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  webDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  webDeleteButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
});
