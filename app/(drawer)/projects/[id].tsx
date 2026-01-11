import React, { useLayoutEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  SafeAreaView,
  useColorScheme,
} from "react-native";
import { router, useNavigation, useLocalSearchParams } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { Colors } from "../../../constants/Colors";
import { RootState } from "../../../redux/store";
import { updateProject } from "../../../redux/slices/projectsSlice";
import {
  addArtifact,
  deleteArtifact,
  Artifact,
} from "../../../redux/slices/artifactsSlice";
import { ArtifactTree } from "../../../components/artifact-tree";
import { IconSymbol } from "../../../components/ui/IconSymbol";
import { v4 as uuidv4 } from "uuid";

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams();
  const projectId = id as string;
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const navigation = useNavigation();

  const project = useSelector(
    (state: RootState) => state.projects.projects[projectId]
  );
  const chats = useSelector((state: RootState) => state.chats.chats);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(project?.description || "");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  // Update navigation title
  useLayoutEffect(() => {
    if (project?.name) {
      navigation.setOptions({
        title: project.name,
      });
    }
  }, [navigation, project?.name]);

  if (!project) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: theme.text }]}>
            Project not found
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.tint }]}
            onPress={() => router.replace("/projects")}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const projectChats = project.chatIds
    .map((chatId) => chats[chatId])
    .filter(Boolean);

  const handleSaveDescription = () => {
    dispatch(
      updateProject({
        id: projectId,
        updates: { description },
      })
    );
    setIsEditingDescription(false);
  };

  const handleAddFolder = () => {
    const name = Platform.OS === "web" ? prompt("Folder name:") : null;
    if (Platform.OS === "web") {
      if (name) {
        dispatch(
          addArtifact({
            id: uuidv4(),
            projectId,
            name,
            type: "folder",
            parentId: selectedArtifact?.type === "folder" ? selectedArtifact.id : null,
          })
        );
      }
    } else {
      Alert.prompt(
        "New Folder",
        "Enter folder name:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Create",
            onPress: (name) => {
              if (name) {
                dispatch(
                  addArtifact({
                    id: uuidv4(),
                    projectId,
                    name,
                    type: "folder",
                    parentId: selectedArtifact?.type === "folder" ? selectedArtifact.id : null,
                  })
                );
              }
            },
          },
        ],
        "plain-text"
      );
    }
  };

  const handleAddFile = () => {
    const name = Platform.OS === "web" ? prompt("File name:") : null;
    if (Platform.OS === "web") {
      if (name) {
        dispatch(
          addArtifact({
            id: uuidv4(),
            projectId,
            name,
            type: "file",
            parentId: selectedArtifact?.type === "folder" ? selectedArtifact.id : null,
            content: "",
          })
        );
      }
    } else {
      Alert.prompt(
        "New File",
        "Enter file name:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Create",
            onPress: (name) => {
              if (name) {
                dispatch(
                  addArtifact({
                    id: uuidv4(),
                    projectId,
                    name,
                    type: "file",
                    parentId: selectedArtifact?.type === "folder" ? selectedArtifact.id : null,
                    content: "",
                  })
                );
              }
            },
          },
        ],
        "plain-text"
      );
    }
  };

  const handleDeleteArtifact = (artifact: Artifact) => {
    const message =
      artifact.type === "folder"
        ? `Delete folder "${artifact.name}" and all its contents?`
        : `Delete file "${artifact.name}"?`;

    if (Platform.OS === "web") {
      if (confirm(message)) {
        dispatch(deleteArtifact(artifact.id));
        if (selectedArtifact?.id === artifact.id) {
          setSelectedArtifact(null);
        }
      }
    } else {
      Alert.alert("Delete", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            dispatch(deleteArtifact(artifact.id));
            if (selectedArtifact?.id === artifact.id) {
              setSelectedArtifact(null);
            }
          },
        },
      ]);
    }
  };

  const containerStyle =
    Platform.OS === "web" ? styles.webContainer : styles.container;
  const contentStyle = Platform.OS === "web" ? styles.webContent : undefined;

  return (
    <SafeAreaView
      style={[containerStyle, { backgroundColor: theme.background }]}
    >
      <ScrollView style={contentStyle} contentContainerStyle={styles.scrollContent}>
        {/* Project Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Description
          </Text>
          {isEditingDescription ? (
            <View style={styles.editDescriptionContainer}>
              <TextInput
                style={[
                  styles.descriptionInput,
                  {
                    color: theme.text,
                    backgroundColor: colorScheme === "dark" ? "#2D2D2D" : "#f5f5f5",
                    borderColor: theme.tint,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description..."
                placeholderTextColor={theme.text + "66"}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditingDescription(false)}
                >
                  <Text style={[styles.editButtonText, { color: theme.text + "99" }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.tint }]}
                  onPress={handleSaveDescription}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingDescription(true)}>
              <Text
                style={[
                  styles.description,
                  { color: project.description ? theme.text : theme.text + "66" },
                ]}
              >
                {project.description || "Tap to add a description..."}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.tint }]}>
                {projectChats.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
                Chats
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.tint }]}>
                {new Date(project.createdAt).toLocaleDateString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text + "99" }]}>
                Created
              </Text>
            </View>
          </View>
        </View>

        {/* Artifacts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Artifacts
            </Text>
            <View style={styles.artifactActions}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: theme.tint + "20" }]}
                onPress={handleAddFolder}
              >
                <IconSymbol name="folder.badge.plus" size={18} color={theme.tint} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: theme.tint + "20" }]}
                onPress={handleAddFile}
              >
                <IconSymbol name="doc.badge.plus" size={18} color={theme.tint} />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={[
              styles.treeContainer,
              { backgroundColor: colorScheme === "dark" ? "#2D2D2D" : "#f5f5f5" },
            ]}
          >
            <ArtifactTree
              projectId={projectId}
              onSelectArtifact={setSelectedArtifact}
              onLongPressArtifact={handleDeleteArtifact}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    alignItems: "center",
  },
  webContent: {
    width: "100%",
    maxWidth: 600,
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  editDescriptionContainer: {
    gap: 12,
  },
  descriptionInput: {
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  artifactActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
  },
  treeContainer: {
    borderRadius: 8,
    minHeight: 120,
    overflow: "hidden",
  },
});
