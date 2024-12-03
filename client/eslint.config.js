// eslint.config.js
import eslint from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplateParser from '@angular-eslint/template-parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { commonRules } from '../eslint.config-base.js';

const tsConfig = {
  files: ['**/*.ts'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: './tsconfig.json',
    },
    ecmaVersion: "latest", // Enable ES2022+ features
    sourceType: "module",
    globals: {
      window: "readonly",
      document: "readonly",
      setInterval: "readonly",
      clearInterval: "readonly",
      console: "readonly",
      localStorage: "true"
    }
  },
  plugins: {
    '@typescript-eslint': tsEslint,
    '@angular-eslint': angular,
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    ...(eslint.configs.recommended?.rules || {}),
    ...(tsEslint.configs.recommended?.rules || {}),
    ...(tsEslint.configs['stylistic-type-checked']?.rules || {}),
    ...(angular.configs['ng-cli-compat']?.rules || {}),
    ...(angular.configs['ng-cli-compat--formatting-add-on']?.rules || {}),
    'simple-import-sort/imports': [
      'error',
      {
        groups: [['^\\u0000'], ['^@?(?!baf)\\w'], ['^@baf?\\w'], ['^\\w'], ['^[^.]'], ['^\\.']],
      },
    ],
    'simple-import-sort/exports': 'error',
    '@angular-eslint/directive-selector': [
      'error',
      { type: 'attribute', prefix: 'app', style: 'camelCase' },
    ],
    '@angular-eslint/component-selector': [
      'error',
      { type: 'element', prefix: 'app', style: 'kebab-case' },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'variable', format: ['camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
      { selector: 'typeLike', format: ['PascalCase'] },
      { selector: 'enumMember', format: ['PascalCase'] },
      { selector: 'property', format: null },
      { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow', trailingUnderscore: 'allow' },
    ],
    complexity: ['error', { max: 10 }],
    'max-len': ['error', { code: 140, ignoreComments: true, ignoreUrls: true }],
    'no-new-wrappers': 'error',
    'no-throw-literal': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-invalid-this': ['warn'],
    '@angular-eslint/no-host-metadata-property': 'off',
    ...Object.fromEntries(
      Object.entries(commonRules).map(([rule, config]) => [rule, Array.isArray(config) ? config : [config]])
    ),
  },
};

const htmlConfig = {
  files: ['**/*.html'],
  languageOptions: {
    parser: angularTemplateParser,
  },
  plugins: {
    '@angular-eslint': angular,
  },
  rules: {
    ...(angular.configs['recommended--extra']?.rules || {}),
    ...(angular.configs['template-accessibility']?.rules || {}),
  },
};

export default [tsConfig, htmlConfig];
