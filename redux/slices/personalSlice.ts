import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PersonalState {
  data: string;
}

const initialState: PersonalState = {
  data: JSON.stringify({
    name: "?",
    age: "?",
    gender: "?",
    location: "?",
    occupation: "?",
    goals: [{ id: 1, goal: "get to learn how to use ToGODer", priority: "low", status: "in progress", steps_taken: "installed app" }],
    likes: [],
    dislikes: [],
    friends: []
  }),
};

const personalSlice = createSlice({
  name: "personal",
  initialState,
  reducers: {
    setPersonalData: (state, action: PayloadAction<Record<string, any>>) => {
      state.data = JSON.stringify(action.payload);
    },
  },
});

export const { setPersonalData } = personalSlice.actions;

export const selectPersonalData = createSelector(
  (state: { personal: PersonalState }) => state.personal.data,
  (data) => {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
);

export default personalSlice.reducer;
