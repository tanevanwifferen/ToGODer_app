import { useDispatch } from "react-redux";
import {
  bypassLockForQuickAction,
  resetBypassLock,
} from "../redux/slices/passcodeSlice";

/**
 * Custom hook to manage passcode bypass for quick actions
 * This ensures the hook is used within the Redux Provider context
 */
export function useBypassLock() {
  const dispatch = useDispatch();

  const bypassLockForQuickActionHandler = () => {
    dispatch(bypassLockForQuickAction());
  };

  const resetBypassLockHandler = () => {
    dispatch(resetBypassLock());
  };

  return {
    bypassLockForQuickAction: bypassLockForQuickActionHandler,
    resetBypassLock: resetBypassLockHandler,
  };
}
