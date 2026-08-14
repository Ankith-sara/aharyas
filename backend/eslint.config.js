import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    ignores: ['node_modules', 'dist', 'coverage', 'tests/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      security,
      sonarjs
    },
    rules: {
      ...js.configs.recommended.rules,
      ...security.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      'sonarjs/no-duplicate-string': 'off', // Noisy in API response routing
      'sonarjs/cognitive-complexity': ['warn', 25],
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }]
    }
  }
];
