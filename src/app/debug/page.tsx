"use client";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authAPI, userAPI } from "@/services/api";
import { toast } from "@/components/ui/toast-notification";

export default function DebugPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const testAutoLogin = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.autoLogin(address);
      console.log("Auto login response:", response);
      setUserData(response.user);
      toast.success(response.message);
    } catch (error) {
      console.error("Auto login error:", error);
      toast.error("Auto login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateUser = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      // 获取nonce
      const nonceResponse = await authAPI.getNonce(address);
      console.log("Nonce response:", nonceResponse);

      // 构建签名消息
      const timestamp = Date.now();
      const message = `Welcome to BoBoom!\n\nSign this message to authenticate your wallet.\n\nWallet: ${address}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

      console.log("Message to sign:", message);

      // 请求用户签名
      const signature = await signMessageAsync({ 
        account: address as `0x${string}`,
        message 
      });
      console.log("Signature:", signature);

      // 创建用户
      const response = await authAPI.createUser({
        address,
        signature,
        message,
        timestamp
      });

      console.log("Create user response:", response);
      setUserData(response);
      toast.success("User created successfully!");
    } catch (error) {
      console.error("Create user error:", error);
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateUser = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        username: "TestUser",
        bio: "This is a test bio from frontend",
        avatar_url: "/media/face/face-01.png"
      };

      console.log("Updating user with data:", updateData);
      const response = await userAPI.updateUser(address, updateData);
      console.log("Update user response:", response);
      setUserData(response);
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateUserWithEmoji = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        username: "EmojiUser",
        bio: "This user has an emoji avatar",
        avatar_url: "😎"
      };

      console.log("Updating user with emoji avatar:", updateData);
      const response = await userAPI.updateUser(address, updateData);
      console.log("Update user response:", response);
      setUserData(response);
      toast.success("User updated with emoji avatar!");
    } catch (error) {
      console.error("Update user error:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Page</h1>

        {/* Wallet Status */}
        <div className="bg-[#151515] p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Status</h2>
          <div className="space-y-2">
            <p>Connected: {isConnected ? "Yes" : "No"}</p>
            <p>Address: {address || "Not connected"}</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-[#151515] p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Functions</h2>
          <div className="space-y-4">
            <button
              onClick={testAutoLogin}
              disabled={!isConnected || isLoading}
              className="bg-[#70E000] text-black px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Test Auto Login"}
            </button>

            <button
              onClick={testCreateUser}
              disabled={!isConnected || isLoading}
              className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg disabled:opacity-50 ml-4"
            >
              {isLoading ? "Loading..." : "Test Create User (with signature)"}
            </button>

            <button
              onClick={testUpdateUser}
              disabled={!isConnected || isLoading}
              className="bg-[#10b981] text-white px-4 py-2 rounded-lg disabled:opacity-50 ml-4"
            >
              {isLoading ? "Loading..." : "Test Update User"}
            </button>

            <button
              onClick={testUpdateUserWithEmoji}
              disabled={!isConnected || isLoading}
              className="bg-[#f59e0b] text-white px-4 py-2 rounded-lg disabled:opacity-50 ml-4"
            >
              {isLoading ? "Loading..." : "Test Emoji Avatar"}
            </button>
          </div>
        </div>

        {/* User Data */}
        {userData && (
          <div className="bg-[#151515] p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">User Data</h2>
            <pre className="bg-[#0E0E0E] p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        )}

        {/* Media Test */}
        <div className="bg-[#151515] p-6 rounded-2xl mt-6">
          <h2 className="text-xl font-semibold mb-4">Media File Test</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/media/face/face-01.png" 
                alt="Test Avatar" 
                className="w-16 h-16 rounded-full"
                onLoad={() => console.log('✅ Avatar image loaded successfully')}
                onError={(e) => console.log('❌ Avatar image failed to load:', e)}
              />
              <div>
                <p className="text-white">Test Avatar Image</p>
                <p className="text-gray-400 text-sm">Should display face-01.png</p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/media/face/face-01.png');
                  console.log('Media file test:', response.status);
                  if (response.ok) {
                    toast.success('Media proxy is working!');
                  } else {
                    toast.error('Media proxy failed');
                  }
                } catch (error) {
                  console.error('Media test error:', error);
                  toast.error('Media test failed');
                }
              }}
              className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg"
            >
              Test Media Proxy
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[#151515] p-6 rounded-2xl mt-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Connect your wallet using the RainbowKit button</li>
            <li>Click "Test Auto Login" to test automatic user creation</li>
            <li>Click "Test Create User" to test user creation with signature verification</li>
            <li>Check the console for detailed logs</li>
            <li>Check the user data section for the response</li>
            <li>Check the media file test section for avatar display</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
