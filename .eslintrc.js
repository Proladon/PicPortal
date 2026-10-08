module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  overrides: [{ files: ['*.ts'], rules: { 'no-undef': 'off' } }],
  rules: {
    semi: ['error', 'never'],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prettier/prettier': [
      'warn',
      {
        '#': 'prettier config in here :)',
        singleQuote: true,
        semi: false,
        endOfLine: 'auto',
        trailingComma: 'none'
      }
    ]
  }
}
