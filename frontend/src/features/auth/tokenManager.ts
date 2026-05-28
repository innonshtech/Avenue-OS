type RefreshCallback = () => void;

class TokenManager {
  private isRefreshing = false;
  private refreshSubscribers: RefreshCallback[] = [];

  getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  setIsRefreshing(value: boolean): void {
    this.isRefreshing = value;
  }

  subscribe(callback: RefreshCallback): void {
    this.refreshSubscribers.push(callback);
  }

  onRefreshed(): void {
    this.refreshSubscribers.forEach((cb) => cb());
    this.refreshSubscribers = [];
  }

  clearSubscribers(): void {
    this.refreshSubscribers = [];
    this.isRefreshing = false;
  }
}

export const tokenManager = new TokenManager();
