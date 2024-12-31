import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// Sanitize the globals to ensure no leading or trailing whitespace
const sanitizedGlobals = Object.fromEntries(
  Object.entries({
    ...globals.node,
    ...globals.browser,
  }).map(([key, value]) => [key.trim(), value]),
);

export default [
  ...compat.extends('eslint:recommended'),
  {
    languageOptions: {
      globals: sanitizedGlobals, // Use sanitized globals
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
];
