import type { SessionState } from "./types";

// 会话存储接口。默认内存实现（brief §7.8：不做数据留存默认项）。
// 后续可换 SQLite/Postgres 实现，接口不变。

export interface SessionStore {
  get(id: string): Promise<SessionState | undefined>;
  set(id: string, state: SessionState): Promise<void>;
  delete(id: string): Promise<void>;
}

/** /about 中对外承诺的保留时长：约 2 小时 */
const TTL_MS = 2 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

class MemoryStore implements SessionStore {
  private map = new Map<string, { state: SessionState; expiresAt: number }>();

  async get(id: string): Promise<SessionState | undefined> {
    const entry = this.map.get(id);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(id);
      return undefined;
    }
    return entry.state;
  }

  async set(id: string, state: SessionState): Promise<void> {
    this.map.set(id, { state, expiresAt: Date.now() + TTL_MS });
  }

  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }

  sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (now > entry.expiresAt) this.map.delete(key);
    }
  }
}

// 挂在 globalThis 上：dev 模式 HMR 重建模块也不会丢会话、不会堆定时器
type GlobalWithStore = typeof globalThis & {
  __qingyuStore?: MemoryStore;
};

export function getStore(): SessionStore {
  const g = globalThis as GlobalWithStore;
  if (!g.__qingyuStore) {
    const store = new MemoryStore();
    g.__qingyuStore = store;
    const timer = setInterval(() => store.sweep(), SWEEP_INTERVAL_MS);
    if (typeof timer.unref === "function") timer.unref();
  }
  return g.__qingyuStore;
}
