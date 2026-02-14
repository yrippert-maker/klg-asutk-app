/**
 * WebSocket client for КЛГ АСУ ТК realtime notifications.
 * Auto-reconnect with exponential backoff.
 * Разработчик: АО «REFLY»
 */

type NotificationHandler = (msg: WsNotification) => void;

export interface WsNotification {
  type: string;
  entity_type: string;
  entity_id?: string;
  timestamp: string;
  [key: string]: any;
}

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1';

class WsClient {
  private ws: WebSocket | null = null;
  private handlers: Set<NotificationHandler> = new Set();
  private userId: string = '';
  private orgId: string = '';
  private reconnectAttempts = 0;
  private maxReconnect = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  connect(userId: string, orgId?: string) {
    if (typeof window === 'undefined') return; // SSR guard
    this.userId = userId;
    this.orgId = orgId || '';
    this._doConnect();
  }

  private _doConnect() {
    try {
      const url = `${WS_BASE}/ws/notifications?user_id=${this.userId}&org_id=${this.orgId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console -- dev-only WS connection log
          console.warn('[WS] Connected');
        }
        this.reconnectAttempts = 0;
        // Start ping every 30s
        this.pingTimer = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 30_000);
      };

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const msg: WsNotification = JSON.parse(event.data);
          this.handlers.forEach(h => h(msg));
        } catch (e) {
          console.warn('[WS] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        if (process.env.NODE_ENV === 'development') console.warn('[WS] Disconnected');
        this._cleanup();
        this._scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (e) {
      this._scheduleReconnect();
    }
  }

  private _cleanup() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
    this.reconnectAttempts++;
    if (process.env.NODE_ENV === 'development') console.warn(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => this._doConnect(), delay);
  }

  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this._cleanup();
    this.maxReconnect = 0; // prevent reconnect
    this.ws?.close();
    this.ws = null;
  }

  onNotification(handler: NotificationHandler) {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton
export const wsClient = new WsClient();
