import {
  StyleSheet,
  View,
  FlatList,
  SafeAreaView,
  Platform,
  useColorScheme,
} from "react-native";
import { Colors } from "../constants/Colors";
import { Chat } from "../redux/slices/chatsSlice";
import { ChatListHeader } from "./chat-list/ChatListHeader";
import { ChatListItem } from "./chat-list/ChatListItem";
import { ChatSectionHeader } from "./chat-list/ChatSectionHeader";
import { useChatListActions } from "../hooks/useChatListActions";
import { useSortedChats } from "../hooks/useSortedChats";

export function ChatList() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { handleCreateNewChat, handleDeleteChat, handleSelectChat } = useChatListActions();
  const { sortedChatRequests, sortedChats, hasRequests } = useSortedChats();

  const renderChatItem = ({
    item,
    isRequest,
  }: {
    item: Chat;
    isRequest?: boolean;
  }) => (
    <ChatListItem
      item={item}
      isRequest={isRequest}
      onSelect={handleSelectChat}
      onDelete={handleDeleteChat}
    />
  );

  const containerStyle =
    Platform.OS === "web" ? styles.webContainer : styles.container;
  const contentStyle = Platform.OS === "web" ? styles.webContent : undefined;

  return (
    <SafeAreaView
      style={[containerStyle, { backgroundColor: theme.background }]}
    >
      <View style={[contentStyle]}>
        <ChatListHeader onNewChat={handleCreateNewChat} />
        <FlatList
          data={[...sortedChatRequests, ...sortedChats]}
          renderItem={({ item, index }) =>
            renderChatItem({
              item,
              isRequest: index < sortedChatRequests.length,
            })
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          ListHeaderComponent={() =>
            hasRequests ? <ChatSectionHeader title="Requests" /> : null
          }
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
    alignItems: "center",
  },
  webContent: {
    width: "100%",
    maxWidth: 600,
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});
