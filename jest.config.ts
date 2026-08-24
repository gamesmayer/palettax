import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transformIgnorePatterns: ['/node_modules/(?!(fast-png|iobuffer)/)'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    '^.+\\.js$': [
      'ts-jest',
      { tsconfig: 'tsconfig.jest.json', isolatedModules: true }
    ]
  }
};

export default config;
