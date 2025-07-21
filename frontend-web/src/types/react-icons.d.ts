import 'react';

declare module 'react-icons/fi' {
  import { IconType } from 'react-icons';
  
  export interface IconProps {
    className?: string;
    size?: string | number;
    color?: string;
    style?: React.CSSProperties;
  }
  
  export const FiPlus: React.FC<IconProps>;
  export const FiSearch: React.FC<IconProps>;
  export const FiFilter: React.FC<IconProps>;
  export const FiDownload: React.FC<IconProps>;
  export const FiPackage: React.FC<IconProps>;
  export const FiBarChart: React.FC<IconProps>;
  export const FiTrendingUp: React.FC<IconProps>;
  export const FiTrendingDown: React.FC<IconProps>;
  export const FiEye: React.FC<IconProps>;
  export const FiEdit: React.FC<IconProps>;
  export const FiTrash2: React.FC<IconProps>;
  export const FiAlertTriangle: React.FC<IconProps>;
  export const FiCheck: React.FC<IconProps>;
}
