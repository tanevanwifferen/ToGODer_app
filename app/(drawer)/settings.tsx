import React from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import ModelSettings from '../../components/settings/ModelSettings';
import ConversationSettings from '../../components/settings/ConversationSettings';
import BackgroundServiceSettings from '../../components/settings/BackgroundServiceSettings';

const Settings = () => {
  return (
    <ScrollView style={styles.container}>
      <ModelSettings />
      <ConversationSettings />
      {Platform.OS !== "web" && <BackgroundServiceSettings />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default Settings;
