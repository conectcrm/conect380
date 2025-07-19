import React from 'react';

interface BaseIconProps {
  size?: number | string;
  className?: string;
  color?: string;
  children: React.ReactNode;
  viewBox?: string;
  'aria-label'?: string;
}

export const BaseIcon: React.FC<BaseIconProps> = ({
  size = 24,
  className = '',
  color = 'currentColor',
  children,
  viewBox = '0 0 24 24',
  'aria-label': ariaLabel,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block ${className}`}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
};
