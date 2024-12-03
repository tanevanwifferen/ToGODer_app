import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addChat, deleteChat, setCurrentChat } from "../redux/slices/chatsSlice";
import CustomAlert from "../components/ui/CustomAlert";

export const useChatListActions = () => {
  const dispatch = useDispatch();

  const handleCreateNewChat = () => {
    const newChatId = uuidv4();
    dispatch(
      addChat({
        id: newChatId,
        title: null,
        messages: [],
      })
    );
    dispatch(setCurrentChat(newChatId));
  };

  const handleDeleteChat = (chatId: string, title: string | null | undefined) => {
    CustomAlert.alert(
      "Delete Chat",
      `Are you sure you want to delete "${title || "Untitled Chat"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(deleteChat(chatId)),
        },
      ]
    );
  };

  const handleSelectChat = (chatId: string) => {
    dispatch(setCurrentChat(chatId));
  };

  return {
    handleCreateNewChat,
    handleDeleteChat,
    handleSelectChat,
  };
};
