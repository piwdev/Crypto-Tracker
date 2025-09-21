import React, { useState, useCallback, useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  src,
  alt,
  className = '',
  fallbackSrc,
  loading = 'lazy',
  width,
  height
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const imageSrc = useMemo(() => {
    if (hasError && fallbackSrc) {
      return fallbackSrc;
    }
    return src;
  }, [hasError, fallbackSrc, src]);

  const imageStyle = useMemo(() => ({
    opacity: isLoaded ? 1 : 0.5,
    transition: 'opacity 0.2s ease-in-out',
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  }), [isLoaded, width, height]);

  if (hasError && !fallbackSrc) {
    return (
      <div 
        className={`${className} image-placeholder`}
        style={{
          width: width ? `${width}px` : '24px',
          height: height ? `${height}px` : '24px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666'
        }}
      >
        N/A
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={imageStyle}
      loading={loading}
      onError={handleError}
      onLoad={handleLoad}
      width={width}
      height={height}
    />
  );
});

export default OptimizedImage;