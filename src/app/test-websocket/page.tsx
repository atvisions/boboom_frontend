"use client";

import { useState, useEffect } from "react";
import websocketService from "@/services/websocket";

export default function TestWebSocketPage() {
  const [connectionStatus, setConnectionStatus] = useState<{[key: string]: string}>({});
  const [receivedData, setReceivedData] = useState<{[key: string]: any}>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    const endpoints = [
      'transactions/',
      'tokens/new/',
      'transactions/whale/'
    ];

    const connectionIds: string[] = [];

    endpoints.forEach(endpoint => {
      addLog(`尝试连接到: ${endpoint}`);
      
      const connectionId = websocketService.connect(
        endpoint,
        (data) => {
          addLog(`收到数据 ${endpoint}: ${data.type}`);
          setReceivedData(prev => ({
            ...prev,
            [endpoint]: data
          }));
        },
        (error) => {
          addLog(`连接错误 ${endpoint}: ${error}`);
          setConnectionStatus(prev => ({
            ...prev,
            [endpoint]: 'error'
          }));
        },
        () => {
          addLog(`连接关闭 ${endpoint}`);
          setConnectionStatus(prev => ({
            ...prev,
            [endpoint]: 'closed'
          }));
        }
      );

      connectionIds.push(connectionId);
      setConnectionStatus(prev => ({
        ...prev,
        [endpoint]: 'connecting'
      }));
    });

    // 清理函数
    return () => {
      connectionIds.forEach(id => {
        websocketService.disconnect(id);
      });
    };
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">WebSocket 连接测试</h1>
      
      {/* 连接状态 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">连接状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(connectionStatus).map(([endpoint, status]) => (
            <div key={endpoint} className="p-4 border rounded-lg">
              <div className="font-medium">{endpoint}</div>
              <div className={`text-sm ${
                status === 'connecting' ? 'text-yellow-600' :
                status === 'error' ? 'text-red-600' :
                status === 'closed' ? 'text-gray-600' :
                'text-green-600'
              }`}>
                {status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 接收到的数据 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">接收到的数据</h2>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(receivedData).map(([endpoint, data]) => (
            <div key={endpoint} className="p-4 border rounded-lg">
              <div className="font-medium mb-2">{endpoint}</div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* 日志 */}
      <div>
        <h2 className="text-xl font-semibold mb-3">连接日志</h2>
        <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
