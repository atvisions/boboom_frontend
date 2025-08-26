"use client";

import { useState, useCallback, useRef } from "react";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/notify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageUpload: (imageUrl: string) => void;
}

export function ImageUploader({ currentImageUrl, onImageUpload }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 上传图片到后端
  const uploadImage = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tokens/upload-image/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        return data.data.url;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, []);

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
    }

    // 检查文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      notifyError('Invalid File', error);
      return;
    }

    setIsUploading(true);

    try {
      notifyInfo('Uploading...', 'Please wait while we process your image');
      const imageUrl = await uploadImage(file);
      notifySuccess('Upload Complete', 'Logo uploaded successfully');
      onImageUpload(imageUrl);
    } catch (error) {
      notifyError('Upload Failed', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, uploadImage, onImageUpload]);

  // 处理文件输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 点击上传区域
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${dragOver 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {currentImageUrl ? (
          // 显示当前图片
          <div className="relative aspect-square max-w-xs mx-auto p-4">
            <img
              src={currentImageUrl}
              alt="Token logo"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Click to change</p>
              </div>
            </div>
          </div>
        ) : (
          // 上传提示
          <div className="p-8 text-center">
            {isUploading ? (
              <div className="space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-gray-300">Processing image...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-white font-medium mb-1">Upload Token Logo</p>
                  <p className="text-gray-400 text-sm">
                    Drag & drop an image or click to browse
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  Supports JPEG, PNG, GIF, WebP • Max 5MB • Recommended: 512x512px
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 上传说明 */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>• Image will be automatically optimized and resized</p>
        <p>• Square images work best for token logos</p>
        <p>• Make sure your image is clear and recognizable</p>
      </div>
    </div>
  );
}
