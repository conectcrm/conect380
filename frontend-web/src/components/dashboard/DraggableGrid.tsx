import React from 'react';

interface DraggableGridProps {
  children?: React.ReactNode;
  // Props futuras para grid arrastável
}

const DraggableGrid: React.FC<DraggableGridProps> = ({ children }) => {
  return (
    <div className="draggable-grid">
      {children}
      {/* Implementação futura do grid arrastável */}
    </div>
  );
};

export default DraggableGrid;