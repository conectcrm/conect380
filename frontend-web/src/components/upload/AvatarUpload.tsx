/**
 * 👤 Avatar Upload - Componente específico para upload de avatar
 */

import React, { useState } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { UploadResult } from '../../services/uploadService';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange?: (avatar: UploadResult) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onAvatarChange,
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleUploadSuccess = (results: UploadResult[]) => {
    if (results.length > 0) {
      const avatar = results[0];
      setPreviewUrl(avatar.url);
      onAvatarChange?.(avatar);
    }
    setIsUploading(false);
  };

  const handleUploadError = (error: string) => {
    console.error('Erro no upload do avatar:', error);
    setIsUploading(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Preview do Avatar */}
      <div
        className={`
        ${sizes[size]} rounded-full overflow-hidden border-4 border-white shadow-lg
        bg-gradient-to-br from-gray-100 to-gray-200
        ${disabled ? 'opacity-50' : ''}
      `}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <User className={`${iconSizes[size]} text-gray-400`} />
          </div>
        )}
      </div>

      {/* Botão de Upload */}
      <div className="absolute -bottom-1 -right-1">
        <FileUpload
          category="avatar"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          multiple={false}
          showPreview={false}
          compact={true}
          disabled={disabled || isUploading}
          acceptedFileTypes="image/*"
          className="relative"
        >
          <div
            className={`
            ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'}
            bg-[#159A9C] rounded-full flex items-center justify-center
            text-white shadow-lg hover:bg-[#138A8C] transition-all duration-200
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          >
            {isUploading ? (
              <Loader2 className={`${iconSizes[size]} animate-spin`} />
            ) : (
              <Camera className={iconSizes[size]} />
            )}
          </div>
        </FileUpload>
      </div>

      {/* Estado de loading overlay */}
      {isUploading && (
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-30 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      )}
    </div>
  );
};
