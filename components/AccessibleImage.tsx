/**
 * Доступное изображение с обязательным alt текстом
 */
'use client';

import { ImgHTMLAttributes } from 'react';
import Image from 'next/image';

interface AccessibleImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  src: string;
  alt: string; // Обязательный alt текст
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function AccessibleImage({
  src,
  alt,
  width,
  height,
  priority = false,
  ...props
}: AccessibleImageProps) {
  // Проверка, что alt текст предоставлен
  if (!alt || alt.trim() === '') {
    console.warn('AccessibleImage: alt text is required for accessibility');
  }

  // Если это декоративное изображение, используем пустой alt
  const altText = alt === 'decorative' ? '' : alt;

  return (
    <Image
      src={src}
      alt={altText}
      width={width}
      height={height}
      priority={priority}
      {...props}
      style={{
        ...props.style,
      }}
    />
  );
}
