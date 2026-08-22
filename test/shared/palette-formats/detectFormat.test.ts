import { detectFormatByExtension } from '../../../src/shared/palette-formats/detectFormat';

describe('detectFormatByExtension', () => {
  it('detecta .pal', () => {
    expect(detectFormatByExtension('foo.pal')).toBe('pal');
  });

  it('detecta .gpl', () => {
    expect(detectFormatByExtension('foo.gpl')).toBe('gpl');
  });

  it('detecta .txt', () => {
    expect(detectFormatByExtension('foo.txt')).toBe('txt');
  });

  it('detecta .css', () => {
    expect(detectFormatByExtension('foo.css')).toBe('css');
  });

  it('es insensible a mayúsculas', () => {
    expect(detectFormatByExtension('FOO.PAL')).toBe('pal');
    expect(detectFormatByExtension('FOO.TXT')).toBe('txt');
    expect(detectFormatByExtension('FOO.CSS')).toBe('css');
  });

  it('devuelve null para extensiones no soportadas', () => {
    expect(detectFormatByExtension('foo.bmp')).toBeNull();
  });
});
