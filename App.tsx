import { useFonts } from "expo-font";
import { ExpoRoot } from "expo-router";

export default function App() {
  useFonts({
    MaterialIcons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf"),
    Feather: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf"),
    AntDesign: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf"),
  });
  const ctx = require.context("app");
  return <ExpoRoot context={ctx} />;
}
