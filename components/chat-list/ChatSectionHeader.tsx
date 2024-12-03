import { StyleSheet, View, Text, useColorScheme } from "react-native";

interface ChatSectionHeaderProps {
  title: string;
}

export function ChatSectionHeader({ title }: ChatSectionHeaderProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionHeaderText,
          { color: colorScheme === "dark" ? "#9BA1A6" : "#666" },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
