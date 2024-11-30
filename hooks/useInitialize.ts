import { useCallback, useEffect } from "react";
import { GlobalApiClient } from "../apiClients/GlobalApiClient";
import { setGlobalConfig } from "../redux/slices/globalConfigSlice";
import { store } from "../redux/store";
import { InitializationService } from "../services/InitializationService";

export function useInitialize() {
    const initializeApp = useCallback(async () => {
      try {
        // Initialize auth and API services
        InitializationService.initialize();
        
        // Fetch global config
        const globalConfig = await GlobalApiClient.getGlobalConfig();
        store.dispatch(setGlobalConfig(globalConfig));

        const prompts = await GlobalApiClient.getPrompts();
        store.dispatch(setGlobalConfig({prompts}));
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    }, []);

    useEffect(() => {
        initializeApp();
    }, [initializeApp]);
}
