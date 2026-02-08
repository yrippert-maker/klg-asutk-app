/**
 * Компонент виртуализированного списка для больших объемов данных
 */
'use client';

// import { FixedSizeList as List } from 'react-window';
// Временно отключено, так как react-window не установлен

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T }) => React.ReactNode;
  width?: string | number;
}

export default function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  width = '100%',
}: VirtualizedListProps<T>) {
  // Временно используем простой список, так как react-window не установлен
  return (
    <div style={{ height, width, overflow: 'auto' }}>
      {items.map((item, index) => (
        <div key={index} style={{ height: itemHeight }}>
          {renderItem({ index, style: {}, data: item })}
        </div>
      ))}
    </div>
  );
}
