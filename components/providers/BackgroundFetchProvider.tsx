import React from 'react';
import { useBackgroundFetch } from '../../hooks/useBackgroundFetch';

export const BackgroundFetchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize background fetch
    useBackgroundFetch();

    return <>{children}</>;
};
