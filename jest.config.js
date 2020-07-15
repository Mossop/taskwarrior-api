module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testRegex: [
    "\\.test\\.ts$",
  ],
  testPathIgnorePatterns: [
    "/bin/",
    "/node_modules/",
  ],
  collectCoverageFrom: [
    "src/**/*.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: [["json", {
    file: "coverage-final.json",
  }]],
  setupFilesAfterEnv: [
    "jest-mock-console/dist/setupTestFramework.js",
  ],
  resetModules: true,
  clearMocks: true,
};
