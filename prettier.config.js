module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './tailwind.config.js',
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: { printWidth: 120, proseWrap: 'always' },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: { printWidth: 200 },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: { tabWidth: 2, singleQuote: false },
    },
  ],
}