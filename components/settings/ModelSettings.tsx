import React from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { ChatRequestCommunicationStyle, ChatSettings } from '../../model/ChatRequest';
import { RootState } from '../../redux/store';
import { selectModels } from '../../redux/slices/globalConfigSlice';
import { selectCommunicationStyle, selectModel } from '../../redux/slices/chatSelectors';
import { updateSettings } from '../../redux/slices/chatsSlice';

const ModelSettings = () => {
  const dispatch = useDispatch();
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

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.label}>Model</Text>
        <Picker
          selectedValue={model}
          onValueChange={(value: string) => updateSettingsFn({ model: value })}
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
            updateSettingsFn({ communicationStyle: value })}
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
          onChangeText={(value: string) => updateSettingsFn({ assistant_name: value })}
          placeholder="Enter assistant name"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
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
});

export default ModelSettings;