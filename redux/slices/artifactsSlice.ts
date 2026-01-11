import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface Artifact {
  id: string;
  projectId: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null; // null for root level
  content?: string; // for files
  createdAt: number;
  updatedAt: number;
}

export interface ArtifactsState {
  artifacts: {
    [id: string]: Artifact;
  };
}

const initialState: ArtifactsState = {
  artifacts: {},
};

const artifactsSlice = createSlice({
  name: "artifacts",
  initialState,
  reducers: {
    addArtifact: (
      state,
      action: PayloadAction<Omit<Artifact, "createdAt" | "updatedAt">>
    ) => {
      const now = Date.now();
      state.artifacts[action.payload.id] = {
        ...action.payload,
        createdAt: now,
        updatedAt: now,
      };
    },
    updateArtifact: (
      state,
      action: PayloadAction<{
        id: string;
        updates: Partial<Omit<Artifact, "id" | "projectId" | "createdAt">>;
      }>
    ) => {
      const { id, updates } = action.payload;
      const artifact = state.artifacts[id];
      if (artifact) {
        state.artifacts[id] = {
          ...artifact,
          ...updates,
          updatedAt: Date.now(),
        };
      }
    },
    deleteArtifact: (state, action: PayloadAction<string>) => {
      const artifactId = action.payload;
      const artifact = state.artifacts[artifactId];
      if (!artifact) return;

      // If it's a folder, recursively delete children
      if (artifact.type === "folder") {
        const childIds = Object.values(state.artifacts)
          .filter((a) => a.parentId === artifactId)
          .map((a) => a.id);

        // Delete children recursively
        const deleteRecursive = (ids: string[]) => {
          for (const id of ids) {
            const child = state.artifacts[id];
            if (child?.type === "folder") {
              const grandchildIds = Object.values(state.artifacts)
                .filter((a) => a.parentId === id)
                .map((a) => a.id);
              deleteRecursive(grandchildIds);
            }
            delete state.artifacts[id];
          }
        };
        deleteRecursive(childIds);
      }

      delete state.artifacts[artifactId];
    },
    deleteProjectArtifacts: (state, action: PayloadAction<string>) => {
      const projectId = action.payload;
      const artifactIds = Object.values(state.artifacts)
        .filter((a) => a.projectId === projectId)
        .map((a) => a.id);

      for (const id of artifactIds) {
        delete state.artifacts[id];
      }
    },
    moveArtifact: (
      state,
      action: PayloadAction<{ id: string; newParentId: string | null }>
    ) => {
      const { id, newParentId } = action.payload;
      const artifact = state.artifacts[id];
      if (artifact) {
        artifact.parentId = newParentId;
        artifact.updatedAt = Date.now();
      }
    },
  },
});

export const {
  addArtifact,
  updateArtifact,
  deleteArtifact,
  deleteProjectArtifacts,
  moveArtifact,
} = artifactsSlice.actions;

// Selectors
export const selectAllArtifacts = (state: RootState) => state.artifacts.artifacts;

export const selectProjectArtifacts = (state: RootState, projectId: string) =>
  Object.values(state.artifacts.artifacts).filter(
    (artifact) => artifact.projectId === projectId
  );

export const selectArtifactChildren = (
  state: RootState,
  parentId: string | null,
  projectId: string
) =>
  Object.values(state.artifacts.artifacts).filter(
    (artifact) =>
      artifact.projectId === projectId && artifact.parentId === parentId
  );

export default artifactsSlice.reducer;
