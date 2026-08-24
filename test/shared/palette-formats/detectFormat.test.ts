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

  it('detects .ase', () => {
    expect(detectFormatByExtension('foo.ase')).toBe('ase');
  });

  it('detects .aco', () => {
    expect(detectFormatByExtension('foo.aco')).toBe('aco');
  });

  it('detects .png', () => {
    expect(detectFormatByExtension('foo.png')).toBe('png');
  });

  it('is case-insensitive', () => {
    expect(detectFormatByExtension('FOO.PAL')).toBe('pal');
    expect(detectFormatByExtension('FOO.TXT')).toBe('txt');
    expect(detectFormatByExtension('FOO.CSS')).toBe('css');
    expect(detectFormatByExtension('FOO.ASE')).toBe('ase');
    expect(detectFormatByExtension('FOO.ACO')).toBe('aco');
    expect(detectFormatByExtension('FOO.PNG')).toBe('png');
  });

  it('returns null for unsupported extensions', () => {
    expect(detectFormatByExtension('foo.bmp')).toBeNull();
  });
});
