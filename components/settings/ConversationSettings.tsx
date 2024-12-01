import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Checkbox from 'expo-checkbox';
import { ChatSettings } from '../../model/ChatRequest';
import { selectHumanPrompt, selectKeepGoing, selectOutsideBox, selectLanguage } from '../../redux/slices/chatSelectors';
import { updateSettings } from '../../redux/slices/chatsSlice';

const ConversationSettings = () => {
  const dispatch = useDispatch();
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);
  const language = useSelector(selectLanguage);

  const updateSettingsFn = (newSettings: Partial<ChatSettings>) => {
    dispatch(updateSettings({
      ...newSettings,
    }));
  };

  return (
    <View>
      <View style={styles.inputSection}>
        <Text style={styles.label}>Language</Text>
        <TextInput
          style={styles.input}
          value={language}
          onChangeText={(value: string) => updateSettingsFn({ language: value })}
          placeholder="Enter language (e.g. English)"
          placeholderTextColor="#999"
        />
      </View>

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
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
});

export default ConversationSettings;
