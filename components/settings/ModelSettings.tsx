import React from 'react';
import { View, StyleSheet, Text, TextInput, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { ChatRequestCommunicationStyle, ChatSettings } from '../../model/ChatRequest';
import { RootState } from '../../redux/store';
import { selectModels } from '../../redux/slices/globalConfigSlice';
import { selectCommunicationStyle, selectModel } from '../../redux/slices/chatSelectors';
import { updateSettings } from '../../redux/slices/chatsSlice';
import { Colors } from '../../constants/Colors';

const ModelSettings = () => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const availableModels = useSelector(selectModels);
  const model = useSelector(selectModel);
  const communicationStyle = useSelector(selectCommunicationStyle);
  const assistant_name = useSelector((state: RootState) => state.chats.assistant_name);

  const updateSettingsFn = (newSettings: Partial<ChatSettings>) => {
    dispatch(updateSettings({
      ...newSettings,
    }));
  };

  const communicationStyles = [
    { value: ChatRequestCommunicationStyle.Default, label: 'Default' },
    { value: ChatRequestCommunicationStyle.LessBloat, label: 'Less Bloat' },
    { value: ChatRequestCommunicationStyle.AdaptToConversant, label: 'Adapt to Conversant' },
    { value: ChatRequestCommunicationStyle.Informal, label: 'Informal' },
  ];

  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Model</Text>
        <Picker
          selectedValue={model}
          onValueChange={(value: string) => updateSettingsFn({ model: value })}
          style={[styles.picker, { 
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: theme.icon
          }]}
        >
          {availableModels.map((modelItem: { model: string; title: string }) => (
            <Picker.Item 
              key={modelItem.model} 
              label={modelItem.title} 
              value={modelItem.model}
              color={theme.text}
            />
          ))}
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Communication Style</Text>
        <Picker
          selectedValue={communicationStyle}
          onValueChange={(value: ChatRequestCommunicationStyle) => 
            updateSettingsFn({ communicationStyle: value })}
          style={[styles.picker, { 
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: theme.icon
          }]}
        >
          {communicationStyles.map((style) => (
            <Picker.Item 
              key={style.value} 
              label={style.label} 
              value={style.value}
              color={theme.text}
            />
          ))}
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Assistant Name</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: theme.icon
          }]}
          value={assistant_name}
          onChangeText={(value: string) => updateSettingsFn({ assistant_name: value })}
          placeholder="Enter assistant name"
          placeholderTextColor={theme.icon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    minHeight: 300,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
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
  picker: {
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 48,
    width: '100%',
    maxWidth: 400,
  },
});

export default ModelSettings;
