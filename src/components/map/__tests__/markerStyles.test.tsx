import { describe, it, expect } from 'vitest';
import { markerStyles, getMarkerStyle, MarkerStyle } from '../markerStyles';

describe('markerStyles', () => {
  it('should have classic style defined', () => {
    expect(markerStyles.classic).toBeDefined();
    expect(markerStyles.classic.id).toBe('classic');
    expect(markerStyles.classic.name).toBeDefined();
  });

  it('should have modern style defined', () => {
    expect(markerStyles.modern).toBeDefined();
    expect(markerStyles.modern.id).toBe('modern');
  });

  it('should have minimal style defined', () => {
    expect(markerStyles.minimal).toBeDefined();
    expect(markerStyles.minimal.id).toBe('minimal');
  });

  it('should have renderSVG function for each style', () => {
    Object.values(markerStyles).forEach((style) => {
      expect(typeof style.renderSVG).toBe('function');
    });
  });
});

describe('getMarkerStyle', () => {
  it('should return classic style when requested', () => {
    const style = getMarkerStyle('classic');
    expect(style.id).toBe('classic');
  });

  it('should return modern style when requested', () => {
    const style = getMarkerStyle('modern');
    expect(style.id).toBe('modern');
  });

  it('should return minimal style when requested', () => {
    const style = getMarkerStyle('minimal');
    expect(style.id).toBe('minimal');
  });

  it('should default to classic for invalid style', () => {
    const style = getMarkerStyle('invalid' as MarkerStyle);
    expect(style.id).toBe('classic');
  });
});
