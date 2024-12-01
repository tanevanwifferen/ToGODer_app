import React from 'react';
import { View, StyleSheet, Text, TextInput, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Checkbox from 'expo-checkbox';
import { ChatSettings } from '../../model/ChatRequest';
import { selectHumanPrompt, selectKeepGoing, selectOutsideBox, selectLanguage } from '../../redux/slices/chatSelectors';
import { updateSettings } from '../../redux/slices/chatsSlice';
import { Colors } from '../../constants/Colors';

const ConversationSettings = () => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.inputSection}>
        <Text style={[styles.label, { color: theme.text }]}>Language</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: theme.icon
          }]}
          value={language}
          onChangeText={(value: string) => updateSettingsFn({ language: value })}
          placeholder="Enter language (e.g. English)"
          placeholderTextColor={theme.icon}
        />
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={humanPrompt}
          onValueChange={(value: boolean) => updateSettingsFn({ humanPrompt: value })}
          color={humanPrompt ? theme.tint : undefined}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Conversational Style</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={keepGoing}
          onValueChange={(value: boolean) => updateSettingsFn({ keepGoing: value })}
          color={keepGoing ? theme.tint : undefined}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Keep Conversation Going</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={outsideBox}
          onValueChange={(value: boolean) => updateSettingsFn({ outsideBox: value })}
          color={outsideBox ? theme.tint : undefined}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Think Outside the Box</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
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
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
});

export default ConversationSettings;
