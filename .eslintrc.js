module.exports = {
  "parser": "@typescript-eslint/parser",

  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module",
    "tsconfigRootDir": __dirname,
    "project": ["./tsconfig.json"],
  },

  "settings": {
    "import/ignore": [
      "typescript",
    ],
  },

  "env": {
    "node": true,
    "es6": true,
  },

  "plugins": [
    "mossop",
  ],

  "extends": [
    "plugin:mossop/typescript",
  ],

  "ignorePatterns": ["bin/**/*"],

  "overrides": [{
    "files": [
      "**/*.test.ts",
      "**/__mocks__/*.ts",
    ],

    "env": {
      "jest": true,
    },
  }],
};
