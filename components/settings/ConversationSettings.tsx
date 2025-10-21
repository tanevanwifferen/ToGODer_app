import React from 'react';
import { View, StyleSheet, Text, TextInput, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ChatSettings } from '../../model/ChatRequest';
import { selectHumanPrompt, selectKeepGoing, selectOutsideBox, selectHolisticTherapist, selectLanguage, selectLibraryIntegrationEnabled } from '../../redux/slices/chatSelectors';
import { updateSettings } from '../../redux/slices/chatsSlice';
import { Colors } from '../../constants/Colors';
import CustomCheckbox from '../ui/CustomCheckbox';
import { selectPersona, setPersona } from '../../redux/slices/personalSlice';

const ConversationSettings = () => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const humanPrompt = useSelector(selectHumanPrompt) ?? false;
  const keepGoing = useSelector(selectKeepGoing) ?? false;
  const outsideBox = useSelector(selectOutsideBox) ?? false;
  const language = useSelector(selectLanguage)
  const holisticTherapist = useSelector(selectHolisticTherapist) ?? false;
  const libraryIntegrationEnabled = useSelector(selectLibraryIntegrationEnabled) ?? false;
  const persona = useSelector(selectPersona);

  const updateSettingsFn = (newSettings: Partial<ChatSettings>) => {
    console.log("updating settings", newSettings);
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
          onChangeText={(value: string) => dispatch(updateSettings({language:value.trim()}))}
          placeholder="Enter language (e.g. English)"
          placeholderTextColor={theme.icon}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.label, { color: theme.text }]}>Persona (used to personalize responses)</Text>
        <TextInput
          style={[styles.multilineInput, {
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: theme.icon
          }]}
          value={persona}
          onChangeText={(value: string) => dispatch(setPersona(value))}
          placeholder='e.g. I am a 28-year-old software engineer who prefers concise answers and Typescript code examples.'
          placeholderTextColor={theme.icon}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={[styles.charCount, { color: theme.icon }]}>{persona?.length ?? 0}/1000</Text>
      </View>

      <View style={styles.checkboxSection}>
        <CustomCheckbox
          value={humanPrompt}
          onValueChange={(value: boolean) => updateSettingsFn({ humanPrompt: value })}
          color={theme.tint}
          colorScheme={colorScheme}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Conversational Style</Text>
      </View>

      <View style={styles.checkboxSection}>
        <CustomCheckbox
          value={keepGoing}
          onValueChange={(value: boolean) => updateSettingsFn({ keepGoing: value })}
          color={theme.tint}
          colorScheme={colorScheme}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Keep Conversation Going</Text>
      </View>

      <View style={styles.checkboxSection}>
        <CustomCheckbox
          value={outsideBox}
          onValueChange={(value: boolean) => updateSettingsFn({ outsideBox: value })}
          color={theme.tint}
          colorScheme={colorScheme}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Think Outside the Box</Text>
      </View>

      <View style={styles.checkboxSection}>
        <CustomCheckbox
          value={holisticTherapist}
          onValueChange={(value: boolean) => updateSettingsFn({ holisticTherapist: value })}
          color={theme.tint}
          colorScheme={colorScheme}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Use new model to ask questions (Experimental)</Text>
      </View>

      <View style={styles.checkboxSection}>
        <CustomCheckbox
          value={libraryIntegrationEnabled}
          onValueChange={(value: boolean) => updateSettingsFn({ libraryIntegrationEnabled: value })}
          color={theme.tint}
          colorScheme={colorScheme}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Library Integration (use PDF librarian context)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    minHeight: 300,
  },
  checkboxSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 40,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
  inputSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
    width: '100%',
    maxWidth: 400,
  },
  multilineInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    minHeight: 96,
    width: '100%',
    maxWidth: 600,
  },
  charCount: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'right',
  },
});

export default ConversationSettings;
