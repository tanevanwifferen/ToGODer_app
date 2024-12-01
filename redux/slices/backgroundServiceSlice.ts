import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BackgroundServiceConfig } from '../../model/BackgroundService';
import { RootState } from '../store';

const initialState: BackgroundServiceConfig = {
    enabled: false,
    preferredHour: 9, // Default to 9 AM
};

const backgroundServiceSlice = createSlice({
    name: 'backgroundService',
    initialState,
    reducers: {
        updateBackgroundService: (state, action: PayloadAction<Partial<BackgroundServiceConfig>>) => {
            return { ...state, ...action.payload };
        },
    },
});

// Actions
export const { updateBackgroundService } = backgroundServiceSlice.actions;

// Selectors
export const selectBackgroundService = (state: RootState) => state.backgroundService;
export const selectBackgroundServiceEnabled = (state: RootState) => state.backgroundService.enabled;
export const selectBackgroundServicePreferredHour = (state: RootState) => state.backgroundService.preferredHour;

export default backgroundServiceSlice.reducer;
