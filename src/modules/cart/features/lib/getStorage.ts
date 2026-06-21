import type { PreferencesPlugin } from "@capacitor/preferences";

import { IS_CAPACITOR } from "@/shared/config/platform";

class StorageProvider {
  private preferences: PreferencesPlugin | null = null;

  private async loadPreferences() {
    if (!this.preferences) {
      const { Preferences } = await import("@capacitor/preferences");
      this.preferences = Preferences;
    }
  }

  async get(key: string): Promise<{ value: string | null }> {
    if (IS_CAPACITOR) {
      await this.loadPreferences();

      const pref = this.preferences;
      if (pref) {
        return pref.get({ key });
      }
    }

    const value = globalThis.window ? localStorage.getItem(key) : null;
    return { value };
  }

  async set(key: string, value: string) {
    if (IS_CAPACITOR) {
      await this.loadPreferences();

      const pref = this.preferences;
      if (pref) {
        await pref.set({ key, value });
        return;
      }
    }

    if (globalThis.window) {
      localStorage.setItem(key, value);
    }
  }
}

export const storage = new StorageProvider();
