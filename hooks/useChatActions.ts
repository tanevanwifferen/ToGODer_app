import { IMessage } from 'react-native-gifted-chat';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import CustomAlert from '@/components/ui/CustomAlert';

export const useChatActions = (messages: IMessage[], onDeleteMessage: (messageId: any) => void) => {
  const showToast = () => {
    Toast.show({
      type: 'success',
      text1: 'Message copied to clipboard',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const onLongPress = (context: any, message: IMessage) => {
    const options = ['Copy', 'Delete', 'Cancel'];
    const cancelButtonIndex = 2;
    const destructiveButtonIndex = 1;

    context.actionSheet().showActionSheetWithOptions({
      options,
      cancelButtonIndex,
      destructiveButtonIndex,
    },
    (buttonIndex: number) => {
      switch (buttonIndex) {
        case 0:
          Clipboard.setString(message.text || '');
          showToast();
          break;
        case 1:
          CustomAlert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  onDeleteMessage(message._id);
                },
              },
            ],
          );
          break;
      }
    });
  };

  return {
    onLongPress
  };
};
