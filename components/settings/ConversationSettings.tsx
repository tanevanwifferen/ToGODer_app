import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Checkbox from 'expo-checkbox';
import { ChatSettings } from '../../model/ChatRequest';
import { selectHumanPrompt, selectKeepGoing, selectOutsideBox } from '../../redux/slices/chatSelectors';
import { updateSettings } from '../../redux/slices/chatsSlice';

const ConversationSettings = () => {
  const dispatch = useDispatch();
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);

  const updateSettingsFn = (newSettings: Partial<ChatSettings>) => {
    dispatch(updateSettings({
      ...newSettings,
    }));
  };

  return (
    <View>
      <View style={styles.checkboxSection}>
        <Checkbox
          value={humanPrompt}
          onValueChange={(value: boolean) => updateSettingsFn({ humanPrompt: value })}
        />
        <Text style={styles.checkboxLabel}>Conversational Style</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={keepGoing}
          onValueChange={(value: boolean) => updateSettingsFn({ keepGoing: value })}
        />
        <Text style={styles.checkboxLabel}>Keep Conversation Going</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={outsideBox}
          onValueChange={(value: boolean) => updateSettingsFn({ outsideBox: value })}
        />
        <Text style={styles.checkboxLabel}>Think Outside the Box</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  checkboxSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});

export default ConversationSettings;
