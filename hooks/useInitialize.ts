import { useCallback, useEffect } from "react";
import { GlobalApiClient } from "../apiClients/GlobalApiClient";
import { setGlobalConfig } from "../redux/slices/globalConfigSlice";
import { store, persistor } from "../redux/store";

export function useInitialize() {
    const initializeApp: any = useCallback(async () => {
      try {
        const globalConfig = await GlobalApiClient.getGlobalConfig();
        store.dispatch(setGlobalConfig(globalConfig));
      } catch (error) {
        console.error("Failed to fetch global config:", error);
      }
    }, []);
    useEffect(()=>{
        initializeApp()
    }, [initializeApp]);
}
