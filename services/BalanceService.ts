import { store } from '../redux/store';
import { setBalance, setLoading, setError } from '../redux/slices/balanceSlice';
import { GlobalApiClient } from '../apiClients/GlobalApiClient';

export class BalanceService {
  private static instance: BalanceService;

  private constructor() {}

  public static getInstance(): BalanceService {
    if (!BalanceService.instance) {
      BalanceService.instance = new BalanceService();
    }
    return BalanceService.instance;
  }

  public async fetchBalance(): Promise<void> {
    try {
      store.dispatch(setLoading(true));
      const response = await GlobalApiClient.getBalance();
      store.dispatch(setBalance(response.balance));
    } catch (error) {
      store.dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch balance'));
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  public async updateBalanceIfAuthenticated(): Promise<void> {
    const state = store.getState();
    if (state.auth.isAuthenticated) {
      await this.fetchBalance();
    }
  }
}
