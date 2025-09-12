"use client";

import { useState, useEffect } from "react";

export default function DebugWebSocketPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  useEffect(() => {
    console.log('DebugWebSocket: Starting WebSocket connection...');

    // 测试多个端点
    const endpoints = ['transactions/', 'tokens/new/', 'transactions/whale/'];
    const connections: WebSocket[] = [];

    endpoints.forEach((endpoint, index) => {
      const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${endpoint}`);
      connections.push(ws);

      ws.onopen = () => {
        console.log(`DebugWebSocket: Connected to ${endpoint}`);
        setConnectionStatus('connected');

        // 发送心跳
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));

        // 请求初始数据
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'request_update'
          }));
        }, 100);
      };

      ws.onmessage = (event) => {
        console.log(`DebugWebSocket: Received message from ${endpoint}:`, event.data);
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [
            {
              timestamp: new Date().toLocaleTimeString(),
              endpoint: endpoint,
              data: data
            },
            ...prev.slice(0, 19) // 只保留最近20条消息
          ]);
        } catch (error) {
          console.error(`DebugWebSocket: Error parsing message from ${endpoint}:`, error);
        }
      };

      ws.onerror = (error) => {
        console.error(`DebugWebSocket: WebSocket error for ${endpoint}:`, error);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log(`DebugWebSocket: Connection closed for ${endpoint}:`, event.code, event.reason);
        if (index === 0) { // 只在第一个连接关闭时更新状态
          setConnectionStatus('closed');
        }
      };
    });

    return () => {
      connections.forEach(ws => ws.close());
    };
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">WebSocket 调试页面</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">连接状态</h2>
        <div className={`inline-block px-4 py-2 rounded-lg text-white ${
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'error' ? 'bg-red-500' :
          connectionStatus === 'closed' ? 'bg-gray-500' :
          'bg-yellow-500'
        }`}>
          {connectionStatus}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">接收到的消息 ({messages.length})</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">
                {message.timestamp}
              </div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto">
                {JSON.stringify(message.data, null, 2)}
              </pre>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              暂无消息
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
