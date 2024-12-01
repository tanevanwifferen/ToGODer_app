import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Alert } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { addChat, deleteChat, setCurrentChat, Chat } from "../redux/slices/chatsSlice";
import { v4 as uuidv4 } from 'uuid';
import { Swipeable } from 'react-native-gesture-handler';
import { selectChats, selectChatRequests } from "../redux/slices/chatSelectors";

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
    Alert.alert(
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

  const renderRightActions = (chatId: string, title: string | null | undefined) => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction}
        onPress={() => handleLongPress(chatId, title)}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({ item, isRequest }: { item: Chat; isRequest?: boolean }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id, item.title)}
      rightThreshold={-100}
    >
      <TouchableOpacity
        style={[styles.chatItem, isRequest && styles.requestItem]}
        onPress={() => dispatch(setCurrentChat(item.id))}
      >
        <Text style={[styles.chatTitle, isRequest && styles.requestTitle]}>
          {isRequest ? '🔔 ' : ''}{item.title || 'Untitled Chat'}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );

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
    height: '100%',
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
});
