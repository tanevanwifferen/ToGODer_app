import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GlobalConfig } from '../../model/GlobalConfig';

const initialState: GlobalConfig = {
  donateOptions: [],
  quote: '',
  models: [],
  prompts: {},
};

const globalConfigSlice = createSlice({
  name: 'globalConfig',
  initialState,
  reducers: {
    setGlobalConfig: (state, action: PayloadAction<GlobalConfig>) => {
      return action.payload;
    },
  },
});

export const { setGlobalConfig } = globalConfigSlice.actions;

export const selectGlobalConfig = (state: { globalConfig: GlobalConfig }): GlobalConfig => 
  state.globalConfig;

export const selectModels = (state: { globalConfig: GlobalConfig }) => state.globalConfig.models;
export const selectPrompts = (state: { globalConfig: GlobalConfig }) => state.globalConfig.prompts;
export const selectQuote = (state: { globalConfig: GlobalConfig }) => state.globalConfig.quote;
export const selectDonateOptions = (state: { globalConfig: GlobalConfig }) => state.globalConfig.donateOptions;

export default globalConfigSlice.reducer;
