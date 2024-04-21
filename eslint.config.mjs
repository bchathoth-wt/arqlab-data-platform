import { ESLint } from 'eslint';
import path from 'path';
import { fileURLToPath } from 'url';

// Adjusting for ESM if needed, similar to your original setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eslint = new ESLint({
  baseConfig: {
    parser: '@typescript-eslint/parser', // Using the TypeScript parser
    plugins: ['@typescript-eslint'], // Using the TypeScript plugin
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended', // Use recommended rules from the TypeScript plugin
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module', // Using ES modules
      project: './tsconfig.json', // Link to your TypeScript config file
    },
    env: {
      browser: true,
      node: true,
      es2021: true,
    },
    rules: {
      // Define or override rules here
    },
  },
  // Additional configurations like directory settings if needed
  cwd: __dirname,
});

export default eslint;
