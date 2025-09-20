/**
 * WebSocket服务类
 * 优化管理与后端WebSocket接口的连接和数据流
 */

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;
type CloseHandler = (event: CloseEvent) => void;

interface WebSocketConnection {
  ws: WebSocket | null;
  url: string;
  messageHandlers: Set<MessageHandler>;
  errorHandlers: Set<ErrorHandler>;
  closeHandlers: Set<CloseHandler>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  isConnecting: boolean;
  shouldReconnect: boolean;
}

class WebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private baseUrl: string;
  private connectionThrottle: Map<string, number> = new Map();

  constructor() {
    // 从环境变量获取WebSocket服务器地址
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (websocketUrl) {
      this.baseUrl = websocketUrl;
      console.log('🔗 WebSocket URL from env:', websocketUrl);
    } else {
      // 生产环境的默认WebSocket地址
      this.baseUrl = 'wss://api.boboom.fun/ws';
      console.log('🔗 WebSocket URL fallback:', this.baseUrl);
    }

    // WebSocket 服务已初始化
  }



  /**
   * 连接到WebSocket端点
   */
  connect(
    endpoint: string,
    messageHandler?: MessageHandler,
    errorHandler?: ErrorHandler,
    closeHandler?: CloseHandler
  ): string {
    const url = `${this.baseUrl}/${endpoint}`;
    const connectionId = this.generateConnectionId(endpoint);

    // 检查连接节流
    const now = Date.now();
    const lastAttempt = this.connectionThrottle.get(connectionId) || 0;
    const throttleDelay = 5000; // 5秒内不允许重复连接同一端点

    if (now - lastAttempt < throttleDelay) {
      console.log(`🚫 Connection throttled for: ${endpoint}, wait ${Math.ceil((throttleDelay - (now - lastAttempt)) / 1000)}s`);
      // 如果连接存在，返回现有连接ID
      if (this.connections.has(connectionId)) {
        const connection = this.connections.get(connectionId)!;
        if (messageHandler) connection.messageHandlers.add(messageHandler);
        if (errorHandler) connection.errorHandlers.add(errorHandler);
        if (closeHandler) connection.closeHandlers.add(closeHandler);
      }
      return connectionId;
    }

    console.log(`🔗 Requesting WebSocket connection to: ${endpoint}`);

    // 如果连接已存在且状态良好，添加处理器并返回
    if (this.connections.has(connectionId)) {
      const connection = this.connections.get(connectionId)!;
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        console.log(`♻️ Reusing active connection: ${endpoint}`);
        if (messageHandler) connection.messageHandlers.add(messageHandler);
        if (errorHandler) connection.errorHandlers.add(errorHandler);
        if (closeHandler) connection.closeHandlers.add(closeHandler);
        return connectionId;
      } else {
        // 清理无效连接
        console.log(`🧹 Cleaning up stale connection: ${endpoint}`);
        this.disconnect(connectionId);
      }
    }

    // 记录连接尝试时间
    this.connectionThrottle.set(connectionId, now);

    // 创建新连接
    const connection: WebSocketConnection = {
      ws: null,
      url,
      messageHandlers: new Set(messageHandler ? [messageHandler] : []),
      errorHandlers: new Set(errorHandler ? [errorHandler] : []),
      closeHandlers: new Set(closeHandler ? [closeHandler] : []),
      reconnectAttempts: 0,
      maxReconnectAttempts: 3,
      reconnectDelay: 3000,
      isConnecting: false,
      shouldReconnect: true
    };

    this.connections.set(connectionId, connection);
    this.establishConnection(connectionId);

    return connectionId;
  }

  /**
   * 建立WebSocket连接
   */
  private establishConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.isConnecting) return;

    connection.isConnecting = true;

    // 添加随机延迟，避免同时建立多个连接
    const delay = Math.random() * 2000 + 1000; // 1-3秒随机延迟

    setTimeout(() => {
      try {
        console.log(`🔌 Establishing WebSocket connection to: ${connection.url}`);
        const ws = new WebSocket(connection.url);
        connection.ws = ws;

        ws.onopen = () => {
          console.log(`✅ WebSocket connected successfully: ${connection.url}`);
          connection.isConnecting = false;
          connection.reconnectAttempts = 0;

          // 发送心跳
          this.sendHeartbeat(connectionId);

          // 请求初始数据
          setTimeout(() => {
            this.send(connectionId, { type: 'request_update' });
          }, 500); // 增加延迟，确保连接稳定
        };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 处理心跳响应
          if (data.type === 'pong') {
            return;
          }

          // 调用所有消息处理器
          connection.messageHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('❌ Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error, event.data);
        }
      };

        ws.onerror = (error) => {
          const isDevelopment = process.env.NODE_ENV === 'development';

          console.error(`❌ WebSocket connection failed: ${connection.url}`, error);

          connection.isConnecting = false;

        // 调用所有错误处理器
        connection.errorHandlers.forEach(handler => {
          try {
            handler(error);
          } catch (err) {
            console.error('Error in error handler:', err);
          }
        });

        // 如果连接失败次数过多，停止重连
        if (connection.reconnectAttempts >= connection.maxReconnectAttempts) {
          if (isDevelopment) {
            console.warn(`Stopping WebSocket reconnection for ${connection.url}, using API fallback`);
          } else {
            console.warn(`Max reconnect attempts reached for ${connection.url}, stopping reconnection`);
          }
          connection.shouldReconnect = false;
        }
      };

      ws.onclose = (event) => {
        const isDevelopment = process.env.NODE_ENV === 'development';

        connection.isConnecting = false;
        connection.ws = null;

        // 在开发环境中，减少关闭事件的日志输出
        if (!isDevelopment || (event.code !== 1006 && event.code !== 1005)) {
          // 只在非开发环境或非异常关闭时记录详细日志
        }

        // 调用所有关闭处理器
        connection.closeHandlers.forEach(handler => {
          try {
            handler(event);
          } catch (error) {
            console.error('Error in close handler:', error);
          }
        });

          // 尝试重连
          if (connection.shouldReconnect && connection.reconnectAttempts < connection.maxReconnectAttempts) {
            connection.reconnectAttempts++;
            const delay = connection.reconnectDelay * Math.pow(2, connection.reconnectAttempts - 1);

            console.log(`🔄 Reconnecting to ${connection.url} in ${delay}ms (attempt ${connection.reconnectAttempts})`);
            setTimeout(() => {
              this.establishConnection(connectionId);
            }, delay);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        connection.isConnecting = false;
      }
    }, delay);
  }

  /**
   * 发送心跳消息
   */
  private sendHeartbeat(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const heartbeat = {
      type: 'ping',
      timestamp: new Date().toISOString()
    };

    try {
      connection.ws.send(JSON.stringify(heartbeat));
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }

  /**
   * 发送消息到WebSocket
   */
  send(connectionId: string, message: any): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 添加消息处理器
   */
  addMessageHandler(connectionId: string, handler: MessageHandler): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.messageHandlers.add(handler);
    }
  }

  /**
   * 移除消息处理器
   */
  removeMessageHandler(connectionId: string, handler: MessageHandler): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.messageHandlers.delete(handler);
    }
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      // 在开发环境中，减少"连接未找到"的警告
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment) {
        console.warn(`Connection ${connectionId} not found for disconnect`);
      }
      return;
    }

    connection.shouldReconnect = false;

    if (connection.ws) {
      // 设置一个标志，表示这是主动断开
      connection.ws.close(1000, 'Normal closure');
    }

    this.connections.delete(connectionId);
  }

  /**
   * 断开所有连接
   */
  disconnectAll(): void {

    const connectionIds = Array.from(this.connections.keys());
    connectionIds.forEach(connectionId => {
      this.disconnect(connectionId);
    });
  }

  /**
   * 获取连接状态
   */
  getConnectionState(connectionId: string): number | null {
    const connection = this.connections.get(connectionId);
    return connection?.ws?.readyState ?? null;
  }

  /**
   * 检查连接是否活跃
   */
  isConnected(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    return connection?.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 生成连接ID
   */
  private generateConnectionId(endpoint: string): string {
    return `ws_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * 获取所有活跃连接
   */
  getActiveConnections(): string[] {
    const active: string[] = [];
    this.connections.forEach((connection, id) => {
      if (connection.ws?.readyState === WebSocket.OPEN) {
        active.push(id);
      }
    });
    return active;
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): { total: number; active: number; connecting: number; closed: number; error: number } {
    let active = 0, connecting = 0, closed = 0, error = 0;

    this.connections.forEach(connection => {
      switch (connection.ws?.readyState) {
        case WebSocket.OPEN:
          active++;
          break;
        case WebSocket.CONNECTING:
          connecting++;
          break;
        case WebSocket.CLOSED:
          closed++;
          break;
        case WebSocket.CLOSING:
          error++;
          break;
        default:
          if (!connection.ws) closed++;
          break;
      }
    });

    return {
      total: this.connections.size,
      active,
      connecting,
      closed,
      error
    };
  }


}

// 创建单例实例
const websocketService = new WebSocketService();

// 页面卸载时断开所有连接
if (typeof window !== 'undefined') {
  // 清理可能存在的旧连接

  // 导出到全局对象，方便调试
  (window as any).websocketService = websocketService;

  window.addEventListener('beforeunload', () => {
    websocketService.disconnectAll();
  });

  // 页面可见性变化时的处理
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面隐藏时保持连接
    } else {
      // 页面可见时检查连接健康状态
    }
  });


}

export default websocketService;

// 导出便捷方法
export const connectToTokenList = (messageHandler: MessageHandler) => {
  return websocketService.connect('tokens/newest/', messageHandler);
};

export const connectToTrendingTokens = (messageHandler: MessageHandler) => {
  return websocketService.connect('tokens/trending/', messageHandler);
};

export const connectToTransactions = (messageHandler: MessageHandler) => {
  return websocketService.connect('transactions/', messageHandler);
};

export const connectToNewTokens = (messageHandler: MessageHandler) => {
  return websocketService.connect('tokens/new/', messageHandler);
};

export const connectToWhaleTransactions = (messageHandler: MessageHandler) => {
  return websocketService.connect('transactions/whale/', messageHandler);
};

export const connectToTokenDetail = (tokenAddress: string, messageHandler: MessageHandler) => {
  return websocketService.connect(`tokens/${tokenAddress}/`, messageHandler);
};

export const connectToTokenHolders = (tokenAddress: string, messageHandler: MessageHandler) => {
  return websocketService.connect(`tokens/${tokenAddress}/holders/`, messageHandler);
};

export const connectToUserBalance = (userAddress: string, messageHandler: MessageHandler) => {
  return websocketService.connect(`users/${userAddress}/balance/`, messageHandler);
};

// 新增：连接到 K 线 WebSocket（支持 limit 查询参数）
export const connectToTokenCandles = (tokenAddress: string, interval: string, messageHandler: MessageHandler, limit: number = 100) => {
  const endpoint = `tokens/${tokenAddress}/candles/${interval}/?limit=${limit}`;
  return websocketService.connect(endpoint, messageHandler);
};

// 导出类型
export type { MessageHandler, ErrorHandler, CloseHandler };