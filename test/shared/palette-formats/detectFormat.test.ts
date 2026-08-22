import { detectFormatByExtension } from '../../../src/shared/palette-formats/detectFormat';

describe('detectFormatByExtension', () => {
  it('detects .pal', () => {
    expect(detectFormatByExtension('foo.pal')).toBe('pal');
  });

  it('detects .gpl', () => {
    expect(detectFormatByExtension('foo.gpl')).toBe('gpl');
  });

  it('detects .txt', () => {
    expect(detectFormatByExtension('foo.txt')).toBe('txt');
  });

  it('detects .css', () => {
    expect(detectFormatByExtension('foo.css')).toBe('css');
  });

  it('is case-insensitive', () => {
    expect(detectFormatByExtension('FOO.PAL')).toBe('pal');
    expect(detectFormatByExtension('FOO.TXT')).toBe('txt');
    expect(detectFormatByExtension('FOO.CSS')).toBe('css');
  });

  it('returns null for unsupported extensions', () => {
    expect(detectFormatByExtension('foo.bmp')).toBeNull();
  });
});
