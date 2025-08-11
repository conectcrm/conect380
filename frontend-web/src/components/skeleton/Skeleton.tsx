import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export default function Skeleton({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = true
}: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${height} ${width} ${rounded ? 'rounded' : ''} ${className}`}
    />
  );
}
