import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  useColorScheme,
} from "react-native";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Colors } from "../../constants/Colors";
import {
  addArtifact,
  deleteArtifact,
  updateArtifact,
  Artifact,
} from "../../redux/slices/artifactsSlice";
import { ArtifactTree } from "../artifact-tree";
import { IconSymbol } from "../ui/IconSymbol";
import { ArtifactEditorModal } from "./ArtifactEditorModal";

interface ProjectArtifactsTabProps {
  projectId: string;
}

export function ProjectArtifactsTab({ projectId }: ProjectArtifactsTabProps) {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);

  const handleAddFolder = () => {
    const createFolder = (name: string) => {
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
    };

    if (Platform.OS === "web") {
      const name = prompt("Folder name:");
      if (name) createFolder(name);
    } else {
      Alert.prompt(
        "New Folder",
        "Enter folder name:",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create", onPress: (name) => name && createFolder(name) },
        ],
        "plain-text"
      );
    }
  };

  const handleAddFile = () => {
    const createFile = (name: string) => {
      if (name) {
        const newArtifact: Omit<Artifact, "createdAt" | "updatedAt"> = {
          id: uuidv4(),
          projectId,
          name,
          type: "file",
          parentId: selectedArtifact?.type === "folder" ? selectedArtifact.id : null,
          content: "",
        };
        dispatch(addArtifact(newArtifact));
      }
    };

    if (Platform.OS === "web") {
      const name = prompt("File name:");
      if (name) createFile(name);
    } else {
      Alert.prompt(
        "New File",
        "Enter file name:",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create", onPress: (name) => name && createFile(name) },
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

    const confirmDelete = () => {
      dispatch(deleteArtifact(artifact.id));
      if (selectedArtifact?.id === artifact.id) {
        setSelectedArtifact(null);
      }
    };

    if (Platform.OS === "web") {
      if (confirm(message)) confirmDelete();
    } else {
      Alert.alert("Delete", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDelete },
      ]);
    }
  };

  const handleSelectArtifact = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    if (artifact.type === "file") {
      setEditingArtifact(artifact);
      setEditorVisible(true);
    }
  };

  const handleSaveArtifact = (name: string, content: string) => {
    if (editingArtifact) {
      dispatch(
        updateArtifact({
          id: editingArtifact.id,
          updates: { name, content },
        })
      );
    }
    setEditorVisible(false);
    setEditingArtifact(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.actions}>
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
          onSelectArtifact={handleSelectArtifact}
          onLongPressArtifact={handleDeleteArtifact}
        />
      </View>

      <ArtifactEditorModal
        visible={editorVisible}
        artifact={editingArtifact}
        onSave={handleSaveArtifact}
        onClose={() => {
          setEditorVisible(false);
          setEditingArtifact(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
  },
  treeContainer: {
    borderRadius: 8,
    minHeight: 200,
    flex: 1,
    overflow: "hidden",
  },
});
