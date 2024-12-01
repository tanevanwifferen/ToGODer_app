import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ModelSettings from '../../components/settings/ModelSettings';
import ConversationSettings from '../../components/settings/ConversationSettings';
import BackgroundServiceSettings from '../../components/settings/BackgroundServiceSettings';

const Settings = () => {
  return (
    <ScrollView style={styles.container}>
      <ModelSettings />
      <ConversationSettings />
      <BackgroundServiceSettings />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
});

export default Settings;
