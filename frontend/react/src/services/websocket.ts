import type { Match } from '../types/match';

type UpdateCallback = (match: Match) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev, we might need to point to the backend directly if not proxied correctly
    // But since we have a proxy in Vite, we can use /ws/live
    this.url = `${protocol}//${window.location.host}/ws/live`;
  }

  connect(onUpdate: UpdateCallback) {
    this.socket = new WebSocket(this.url);

    this.socket.onmessage = (event) => {
      const match: Match = JSON.parse(event.data);
      onUpdate(match);
    };

    this.socket.onclose = () => {
      console.log('WS connection closed. Reconnecting...');
      setTimeout(() => this.connect(onUpdate), 3000);
    };

    this.socket.onerror = (error) => {
      console.error('WS error:', error);
      this.socket?.close();
    };
  }

  disconnect() {
    this.socket?.close();
  }
}

export const wsService = new WebSocketService();
