import React from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Checkbox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';
import { selectCommunicationStyle, selectHumanPrompt, selectKeepGoing, selectModel, selectOutsideBox, updateSettings as updateSettingsAction } from '../../redux/slices/chatsSlice';
import { ChatRequestCommunicationStyle, ChatSettings } from '../../model/ChatRequest';
import { RootState } from '../../redux/store';
import { selectModels } from '../../redux/slices/globalConfigSlice';
import { selectBackgroundServiceEnabled, selectBackgroundServicePreferredHour, updateBackgroundService } from '../../redux/slices/backgroundServiceSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const availableModels = useSelector(selectModels);
  const model = useSelector(selectModel);
  const humanPrompt = useSelector(selectHumanPrompt);
  const keepGoing = useSelector(selectKeepGoing);
  const outsideBox = useSelector(selectOutsideBox);
  const communicationStyle = useSelector(selectCommunicationStyle);
  const assistant_name = useSelector((state: RootState) => state.chats.assistant_name);
  const backgroundServiceEnabled = useSelector(selectBackgroundServiceEnabled);
  const backgroundServicePreferredHour = useSelector(selectBackgroundServicePreferredHour);

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

  // Generate hours for picker
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Model</Text>
        <Picker
          selectedValue={model}
          onValueChange={(value: string) => updateSettings({ model: value })}
          style={styles.picker}
        >
          {availableModels.map((modelItem: { model: string; title: string }) => (
            <Picker.Item key={modelItem.model} label={modelItem.title} value={modelItem.model} />
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
        <Text style={styles.checkboxLabel}>Conversational Style</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={keepGoing}
          onValueChange={(value: boolean) => updateSettings({ keepGoing: value })}
        />
        <Text style={styles.checkboxLabel}>Keep Conversation Going</Text>
      </View>

      <View style={styles.checkboxSection}>
        <Checkbox
          value={outsideBox}
          onValueChange={(value: boolean) => updateSettings({ outsideBox: value })}
        />
        <Text style={styles.checkboxLabel}>Think Outside the Box</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Service</Text>
        <View style={styles.checkboxSection}>
          <Checkbox
            value={backgroundServiceEnabled}
            onValueChange={(value: boolean) => 
              dispatch(updateBackgroundService({ enabled: value }))}
          />
          <Text style={styles.checkboxLabel}>Enable Periodic Check-ins</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.label}>Preferred Hour</Text>
          <Picker
            selectedValue={backgroundServicePreferredHour}
            onValueChange={(value: number) => 
              dispatch(updateBackgroundService({ preferredHour: value }))}
            style={styles.picker}
            enabled={backgroundServiceEnabled}
          >
            {hours.map((hour) => (
              <Picker.Item key={hour.value} label={hour.label} value={hour.value} />
            ))}
          </Picker>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
