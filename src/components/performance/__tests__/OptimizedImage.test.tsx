import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OptimizedImage, preloadImage, preloadImages } from '../OptimizedImage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with src and alt', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test image" />);
    
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('should apply width and height for aspect ratio', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" width={100} height={50} />);
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('width', '100');
    expect(img).toHaveAttribute('height', '50');
  });

  it('should use lazy loading by default', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" />);
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should use eager loading when priority is true', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" priority />);
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('should apply custom className', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" className="custom-class" />);
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveClass('custom-class');
  });

  it('should set fetchpriority for priority images', () => {
    render(<OptimizedImage src="/test.jpg" alt="Test" priority />);
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });
});

describe('preloadImage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('should create a preload link element', () => {
    preloadImage('/test.jpg');
    
    const link = document.querySelector('link[rel="preload"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test.jpg');
    expect(link).toHaveAttribute('as', 'image');
  });

  it('should set high priority by default', () => {
    preloadImage('/test.jpg');
    
    const link = document.querySelector('link[rel="preload"]');
    expect(link).toHaveAttribute('fetchpriority', 'high');
  });

  it('should set low priority when specified', () => {
    preloadImage('/test.jpg', 'low');
    
    const link = document.querySelector('link[rel="preload"]');
    expect(link).toHaveAttribute('fetchpriority', 'low');
  });
});

describe('preloadImages', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('should preload multiple images', () => {
    preloadImages(['/img1.jpg', '/img2.jpg', '/img3.jpg']);
    
    const links = document.querySelectorAll('link[rel="preload"]');
    expect(links).toHaveLength(3);
  });

  it('should set high priority for first image', () => {
    preloadImages(['/img1.jpg', '/img2.jpg']);
    
    const links = document.querySelectorAll('link[rel="preload"]');
    expect(links[0]).toHaveAttribute('fetchpriority', 'high');
    expect(links[1]).toHaveAttribute('fetchpriority', 'low');
  });
});
