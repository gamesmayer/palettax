import { detectFormatByExtension } from '../../../src/shared/palette-formats/detectFormat';

describe('detectFormatByExtension', () => {
  it('detecta .pal', () => {
    expect(detectFormatByExtension('foo.pal')).toBe('pal');
  });

  it('detecta .gpl', () => {
    expect(detectFormatByExtension('foo.gpl')).toBe('gpl');
  });

  it('es insensible a mayúsculas', () => {
    expect(detectFormatByExtension('FOO.PAL')).toBe('pal');
  });

  it('devuelve null para extensiones no soportadas', () => {
    expect(detectFormatByExtension('foo.txt')).toBeNull();
  });
});
