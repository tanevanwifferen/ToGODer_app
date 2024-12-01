import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Checkbox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";
import {
  selectBackgroundServiceAmount,
  selectBackgroundServiceEnabled,
  selectBackgroundServicePreferredHour,
  updateBackgroundService,
} from "../../redux/slices/backgroundServiceSlice";

const BackgroundServiceSettings = () => {
  const dispatch = useDispatch();
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
    <View>
      <Text style={styles.sectionTitle}>Background Service</Text>
      <View style={styles.checkboxSection}>
        <Checkbox
          value={backgroundServiceEnabled}
          onValueChange={(value: boolean) =>
            dispatch(updateBackgroundService({ enabled: value }))
          }
        />
        <Text style={styles.checkboxLabel}>Enable Periodic Check-ins</Text>
      </View>

      {backgroundServiceEnabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Preferred Hour</Text>
            <Picker
              selectedValue={backgroundServicePreferredHour}
              onValueChange={(value: number) =>
                dispatch(updateBackgroundService({ preferredHour: value }))
              }
              style={styles.picker}
              enabled={backgroundServiceEnabled}
            >
              {hours.map((hour) => (
                <Picker.Item
                  key={hour.value}
                  label={hour.label}
                  value={hour.value}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Notification amount</Text>
            <Picker
              selectedValue={backgroundServiceAmount}
              onValueChange={(value: number) =>
                dispatch(updateBackgroundService({ amount: value }))
              }
              style={styles.picker}
              enabled={backgroundServiceEnabled}
            >
              <Picker.Item key={0} label={"Never"} value={0} />
              <Picker.Item key={0.1} label={"Scarecely"} value={0.1} />
              <Picker.Item key={0.3} label={"Sometimes"} value={0.3} />
              <Picker.Item key={0.6} label={"Regularly"} value={0.6} />
              <Picker.Item key={1} label={"Every day"} value={1} />
            </Picker>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    borderColor: "#ccc",
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
