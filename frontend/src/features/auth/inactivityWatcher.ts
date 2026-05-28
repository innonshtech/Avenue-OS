import { SessionManager } from './sessionManager';

class InactivityWatcher {
  private warningTimeout: any = null;
  private logoutTimeout: any = null;

  // 30 minutes = 1800000ms. Warning at 25 minutes = 1500000ms.
  private INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
  private WARNING_THRESHOLD_MS = 25 * 60 * 1000;

  private onWarningCallback: (() => void) | null = null;
  private onActiveCallback: (() => void) | null = null;

  init(onWarning: () => void, onActive: () => void) {
    this.onWarningCallback = onWarning;
    this.onActiveCallback = onActive;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'visibilitychange'];
    events.forEach((event) => {
      window.addEventListener(event, this.resetTimer);
    });

    this.startTimers();
  }

  destroy() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'visibilitychange'];
    events.forEach((event) => {
      window.removeEventListener(event, this.resetTimer);
    });
    this.clearTimers();
  }

  resetTimer = () => {
    if (document.visibilityState === 'hidden') return;

    this.onActiveCallback?.();
    this.clearTimers();
    this.startTimers();
  };

  private startTimers() {
    this.warningTimeout = setTimeout(() => {
      this.onWarningCallback?.();
    }, this.WARNING_THRESHOLD_MS);

    this.logoutTimeout = setTimeout(() => {
      this.triggerLogout();
    }, this.INACTIVITY_LIMIT_MS);
  }

  private clearTimers() {
    if (this.warningTimeout) clearTimeout(this.warningTimeout);
    if (this.logoutTimeout) clearTimeout(this.logoutTimeout);
  }

  private triggerLogout() {
    this.clearTimers();
    SessionManager.performLogout();
  }
}

export const inactivityWatcher = new InactivityWatcher();
