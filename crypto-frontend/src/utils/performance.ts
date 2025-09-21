// Performance monitoring utilities
import React from 'react';

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  // Start timing a performance metric
  start(name: string): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    });
  }

  // End timing and calculate duration
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    this.metrics.set(name, {
      ...metric,
      endTime,
      duration
    });

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  // Get metric by name
  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for measuring component render time
export const usePerfMeasure = (componentName: string) => {
  React.useEffect(() => {
    performanceMonitor.start(`${componentName}-render`);
    return () => {
      performanceMonitor.end(`${componentName}-render`);
    };
  });
};

// Decorator for measuring function execution time
export const measurePerformance = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyName}`;
    performanceMonitor.start(methodName);
    
    try {
      const result = method.apply(this, args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          performanceMonitor.end(methodName);
        });
      }
      
      performanceMonitor.end(methodName);
      return result;
    } catch (error) {
      performanceMonitor.end(methodName);
      throw error;
    }
  };

  return descriptor;
};

// Utility to debounce function calls for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Utility to throttle function calls for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Check if the browser supports performance API
export const isPerformanceSupported = (): boolean => {
  return typeof performance !== 'undefined' && typeof performance.now === 'function';
};

// Get current performance metrics from the browser
export const getBrowserPerformanceMetrics = () => {
  if (!isPerformanceSupported()) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
    totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
  };
};