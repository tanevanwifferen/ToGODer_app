import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExperienceState {
  modalVisible: boolean;
  inputLanguage: string;
}

const initialState: ExperienceState = {
  modalVisible: false,
  inputLanguage: '',
};

const experienceSlice = createSlice({
  name: 'experience',
  initialState,
  reducers: {
    setModalVisible: (state, action: PayloadAction<boolean>) => {
      state.modalVisible = action.payload;
    },
    setInputLanguage: (state, action: PayloadAction<string>) => {
      state.inputLanguage = action.payload;
    },
  },
});

export const { setModalVisible, setInputLanguage } = experienceSlice.actions;
export default experienceSlice.reducer;
