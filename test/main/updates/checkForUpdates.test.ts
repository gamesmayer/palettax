import { isNewerVersion } from '../../../src/main/updates/checkForUpdates';

describe('isNewerVersion', () => {
  it('detects a higher version', () => {
    expect(isNewerVersion('0.3.0', '0.2.0')).toBe(true);
  });

  it('returns false if the versions are equal', () => {
    expect(isNewerVersion('0.2.0', '0.2.0')).toBe(false);
  });

  it('compares the last segment correctly', () => {
    expect(isNewerVersion('0.2.10', '0.2.9')).toBe(true);
    expect(isNewerVersion('0.2.9', '0.2.10')).toBe(false);
  });

  it('ignores the "v" prefix', () => {
    expect(isNewerVersion('v0.3.0', 'v0.2.0')).toBe(true);
  });

  it('returns false if the latest version is older', () => {
    expect(isNewerVersion('0.1.0', '0.2.0')).toBe(false);
  });
});
