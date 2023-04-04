module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: 'airbnb',
  overrides: [
    {
      extends: [
        'airbnb-typescript',
      ],
      files: [
        '*.ts',
        '*.tsx',
      ],
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
  },
};
