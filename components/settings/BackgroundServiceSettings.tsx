import React from "react";
import { View, StyleSheet, Text, useColorScheme } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Checkbox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";
import {
  selectBackgroundServiceAmount,
  selectBackgroundServiceEnabled,
  selectBackgroundServicePreferredHour,
  updateBackgroundService,
} from "../../redux/slices/backgroundServiceSlice";
import { Colors } from "../../constants/Colors";

const BackgroundServiceSettings = () => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const backgroundServiceEnabled = useSelector(selectBackgroundServiceEnabled);
  const backgroundServicePreferredHour = useSelector(
    selectBackgroundServicePreferredHour
  );
  const backgroundServiceAmount = useSelector(selectBackgroundServiceAmount);

  // Generate hours for picker
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, "0")}:00`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Background Service</Text>
      <View style={styles.checkboxSection}>
        <Checkbox
          value={backgroundServiceEnabled}
          onValueChange={(value: boolean) =>
            dispatch(updateBackgroundService({ enabled: value }))
          }
          color={backgroundServiceEnabled ? theme.tint : undefined}
        />
        <Text style={[styles.checkboxLabel, { color: theme.text }]}>Enable Periodic Check-ins</Text>
      </View>

      {backgroundServiceEnabled && (
        <>
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Preferred Hour</Text>
            <Picker
              selectedValue={backgroundServicePreferredHour}
              onValueChange={(value: number) =>
                dispatch(updateBackgroundService({ preferredHour: value }))
              }
              style={[styles.picker, { 
                backgroundColor: theme.background,
                borderColor: theme.icon,
                color: theme.text
              }]}
              enabled={backgroundServiceEnabled}
            >
              {hours.map((hour) => (
                <Picker.Item
                  key={hour.value}
                  label={hour.label}
                  value={hour.value}
                  color={theme.text}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Notification amount</Text>
            <Picker
              selectedValue={backgroundServiceAmount}
              onValueChange={(value: number) =>
                dispatch(updateBackgroundService({ amount: value }))
              }
              style={[styles.picker, { 
                backgroundColor: theme.background,
                borderColor: theme.icon,
                color: theme.text
              }]}
              enabled={backgroundServiceEnabled}
            >
              <Picker.Item key={0} label={"Never"} value={0} color={theme.text} />
              <Picker.Item key={0.1} label={"Scarecely"} value={0.1} color={theme.text} />
              <Picker.Item key={0.3} label={"Sometimes"} value={0.3} color={theme.text} />
              <Picker.Item key={0.6} label={"Regularly"} value={0.6} color={theme.text} />
              <Picker.Item key={1} label={"Every day"} value={1} color={theme.text} />
            </Picker>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 4,
  },
  checkboxSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});

export default BackgroundServiceSettings;
