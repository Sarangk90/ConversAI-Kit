module.exports = {
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!react-markdown|vfile|unist|unified|bail|is-plain-obj|trough|remark-parse|mdast-util-from-markdown|micromark|decode-named-character-reference|character-entities|mdast-util-to-string|space-separated-tokens|comma-separated-tokens|remark-gfm|mdast-util-gfm|markdown-table|remark-rehype|mdast-util-to-hast|unist-builder|unist-util-position|unist-util-generated|property-information|hast-util-whitespace|rehype-react)/',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
}; 