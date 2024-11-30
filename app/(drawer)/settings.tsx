import React from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Checkbox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import { selectCommunicationStyle, selectHumanPrompt, selectKeepGoing, selectModel, selectOutsideBox, updateSettings as updateSettingsAction } from '../../redux/slices/chatsSlice';
import { ChatRequestCommunicationStyle, ChatSettings } from '../../model/ChatRequest';
import { RootState, selectGlobalConfig, selectModels } from '@/redux';

const Settings = () => {
  const dispatch = useDispatch();
  const availableModels = useSelector(selectModels);
  const model = useSelector(selectModel);
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);
  const communicationStyle = useSelector(selectCommunicationStyle);
  const assistant_name = useSelector((state: RootState) => state.chats.assistant_name);

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    dispatch(updateSettingsAction({
      ...newSettings,
    }));
  };

  const communicationStyles = [
    { value: ChatRequestCommunicationStyle.Default, label: 'Default' },
    { value: ChatRequestCommunicationStyle.LessBloat, label: 'Less Bloat' },
    { value: ChatRequestCommunicationStyle.AdaptToConversant, label: 'Adapt to Conversant' },
    { value: ChatRequestCommunicationStyle.Informal, label: 'Informal' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Model</Text>
        <Picker
          selectedValue={model}
          onValueChange={(value: string) => updateSettings({ model: value })}
          style={styles.picker}
        >
          {availableModels.map((model) => (
            <Picker.Item key={model.model} label={model.title} value={model.model} />
          ))}
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Communication Style</Text>
        <Picker
          selectedValue={communicationStyle}
          onValueChange={(value: ChatRequestCommunicationStyle) => 
            updateSettings({ communicationStyle: value })}
          style={styles.picker}
        >
          {communicationStyles.map((style) => (
            <Picker.Item key={style.value} label={style.label} value={style.value} />
          ))}
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Assistant Name</Text>
        <TextInput
          style={styles.input}
          value={assistant_name}
          onChangeText={(value: string) => updateSettings({ assistant_name: value })}
          placeholder="Enter assistant name"
        />
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={humanPrompt}
          onValueChange={(value: boolean) => updateSettings({ humanPrompt: value })}
        />
        <Text style={styles.checkboxLabel}>Human Prompt</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={keepGoing}
          onValueChange={(value: boolean) => updateSettings({ keepGoing: value })}
        />
        <Text style={styles.checkboxLabel}>Keep Going</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={outsideBox}
          onValueChange={(value: boolean) => updateSettings({ outsideBox: value })}
        />
        <Text style={styles.checkboxLabel}>Think Outside the Box</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginBottom: 60,
    backgroundColor: '#fff',
  },
  section: {
    //height: 50,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
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
});

export default Settings;
