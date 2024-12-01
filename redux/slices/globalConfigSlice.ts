import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { GlobalConfig, Prompt } from '../../model/GlobalConfig';

const initialState: GlobalConfig = {
  donateOptions: [],
  quote: '',
  models: [],
  prompts: {},
  showLogin: false,
  userOnboarded: false,
  appFirstLaunch: true
};

const globalConfigSlice = createSlice({
  name: 'globalConfig',
  initialState,
  reducers: {
    setGlobalConfig: (state, action: PayloadAction<Partial<GlobalConfig>>) => {
      return {
        ...state,
        ...action.payload
      };
    },
  },
});

export const { setGlobalConfig } = globalConfigSlice.actions;

export const selectGlobalConfig = (state: { globalConfig: GlobalConfig }): GlobalConfig => 
  state.globalConfig;

export const selectModels = createSelector(
  [selectGlobalConfig],
  (globalConfig) => globalConfig.models
);

export const selectPrompts = createSelector(
  [selectGlobalConfig],
  (globalConfig) => globalConfig.prompts
);

export const selectQuote = createSelector(
  [selectGlobalConfig],
  (globalConfig) => globalConfig.quote
);

export const selectDonateOptions = createSelector(
  [selectGlobalConfig],
  (globalConfig) => globalConfig.donateOptions
);

export const selectShowLogin = createSelector(
  [selectGlobalConfig],
  (globalConfig) => globalConfig.showLogin
);

export const selectUserOnboarded = createSelector(
  [selectGlobalConfig],
  (globalConfig) => globalConfig.userOnboarded
);

export const selectAppFirstLaunch = createSelector(
  [selectGlobalConfig],
  (globalConfig) => globalConfig.appFirstLaunch
);

export default globalConfigSlice.reducer;
