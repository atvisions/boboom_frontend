"use client";
import { useState } from "react";

export default function DebugPage() {
  const [testValue, setTestValue] = useState("");

  const testLog = () => {
    console.log("=== DEBUG TEST ===");
    console.log("Test value:", testValue);
    console.log("Current time:", new Date().toISOString());
    console.log("==================");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <input
        type="text"
        value={testValue}
        onChange={(e) => setTestValue(e.target.value)}
        placeholder="Enter test value"
        className="border p-2 mr-2"
      />
      <button
        onClick={testLog}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Console Log
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Open browser console (F12) and click the button to test logging
      </p>
    </div>
  );
}
