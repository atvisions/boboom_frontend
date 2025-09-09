/**
 * WebSocket服务类
 * 管理与后端WebSocket接口的连接和数据流
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

  constructor() {
    // 从环境变量获取WebSocket服务器地址
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (websocketUrl) {
      this.baseUrl = websocketUrl;
    } else {
      // WebSocket运行在8001端口，与Django API的8000端口分离
      this.baseUrl = 'ws://localhost:8001/ws';
    }
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
    
    console.log(`WebSocket: Attempting to connect to ${url}`);
    console.log(`WebSocket: Connection ID: ${connectionId}`);

    // 如果连接已存在，添加处理器并返回
    if (this.connections.has(connectionId)) {
      const connection = this.connections.get(connectionId)!;
      if (messageHandler) connection.messageHandlers.add(messageHandler);
      if (errorHandler) connection.errorHandlers.add(errorHandler);
      if (closeHandler) connection.closeHandlers.add(closeHandler);
      return connectionId;
    }

    // 创建新连接
    const connection: WebSocketConnection = {
      ws: null,
      url,
      messageHandlers: new Set(messageHandler ? [messageHandler] : []),
      errorHandlers: new Set(errorHandler ? [errorHandler] : []),
      closeHandlers: new Set(closeHandler ? [closeHandler] : []),
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
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

    try {
      const ws = new WebSocket(connection.url);
      connection.ws = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected: ${connection.url}`);
        connection.isConnecting = false;
        connection.reconnectAttempts = 0;
        
        // 发送心跳
        this.sendHeartbeat(connectionId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 处理心跳响应
          if (data.type === 'pong') {
            console.log(`Heartbeat response received from ${connection.url}`);
            return;
          }

          // 调用所有消息处理器
          connection.messageHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        // 只在连接真正失败时才处理错误（不记录日志，因为某些浏览器会误报）
        connection.isConnecting = false;
        
        // 调用所有错误处理器
        connection.errorHandlers.forEach(handler => {
          try {
            handler(error);
          } catch (err) {
            console.error('Error in error handler:', err);
          }
        });
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed for ${connection.url}:`, event.code, event.reason);
        connection.isConnecting = false;
        connection.ws = null;

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
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${connection.reconnectAttempts}/${connection.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.establishConnection(connectionId);
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      connection.isConnecting = false;
    }
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
      console.warn(`Cannot send message: WebSocket not connected for ${connectionId}`);
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
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
    if (!connection) return;

    connection.shouldReconnect = false;
    
    if (connection.ws) {
      connection.ws.close();
    }

    this.connections.delete(connectionId);
  }

  /**
   * 断开所有连接
   */
  disconnectAll(): void {
    this.connections.forEach((_, connectionId) => {
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
}

// 创建单例实例
const websocketService = new WebSocketService();

// 页面卸载时断开所有连接
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    websocketService.disconnectAll();
  });
}

export default websocketService;

// 导出便捷方法
export const connectToTokenList = (messageHandler: MessageHandler) => {
  return websocketService.connect('tokens/', messageHandler);
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