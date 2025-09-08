import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PersonalState {
  data: any;
  persona: string;
}

const initialState: PersonalState = {
  data: {
    name: "?",
    age: "?",
    gender: "?",
    location: "?",
    occupation: "?",
    goals: [
      {
        id: 1,
        goal: "get to learn how to use ToGODer",
        priority: "low",
        status: "in progress",
        steps_taken: "installed app",
      },
    ],
    likes: [],
    dislikes: [],
    friends: [],
  },
  persona: "",
};

const personalSlice = createSlice({
  name: "personal",
  initialState,
  reducers: {
    setPersonalData: (
      state,
      action: PayloadAction<string | Record<string, any>>
    ) => {
      state.data = action.payload;
    },
    setPersona: (state, action: PayloadAction<string>) => {
      state.persona = action.payload;
    },
  },
});

export const { setPersonalData, setPersona } = personalSlice.actions;

export const selectPersonalData = createSelector(
  (state: { personal: PersonalState }) => state.personal,
  (personal) => personal.data
);

export const selectPersona = createSelector(
  (state: { personal: PersonalState }) => state.personal,
  (personal) => personal.persona || ""
);

export default personalSlice.reducer;
