module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.ts"],
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.jest.json"
        // tsconfig: {
        //   module: "ESNext",
        //   moduleResolution: "Bundler",
        // }
      }
    ]
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.coverage/",
    "<rootDir>/dist/"
  ],
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
  coverageReporters: ["json"],
  coverageDirectory: "<rootDir>/.coverage",
  coverageThreshold: {
    global: {
      statements: 89,
      branches: 90,
      functions: 85,
      lines: 88
    }
  }
}