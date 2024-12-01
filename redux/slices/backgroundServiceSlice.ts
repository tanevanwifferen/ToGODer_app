import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BackgroundServiceConfig } from '../../model/BackgroundService';
import { RootState } from '../store';

const initialState: BackgroundServiceConfig = {
    enabled: false,
    preferredHour: 9, // Default to 9 AM
    amount: 0.3, // Default to 30% of the time
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
export const selectBackgroundServiceState = (state: RootState) => state.backgroundService;
export const selectBackgroundServiceEnabled = createSelector(
    selectBackgroundServiceState,
    (state: BackgroundServiceConfig) => state.enabled
);
export const selectBackgroundServicePreferredHour = createSelector(
    selectBackgroundServiceState,
    (state: BackgroundServiceConfig) => state.preferredHour
);
export const selectBackgroundServiceAmount = createSelector(
    selectBackgroundServiceState,
    (state: BackgroundServiceConfig) => state.amount
);

export default backgroundServiceSlice.reducer;
