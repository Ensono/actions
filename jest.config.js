module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.ts"],
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript" },
          target: "es2023"
        },
        module: { type: "es6" },
        sourceMaps: true
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
  reporters: ["default", ["jest-junit", { outputDirectory: "<rootDir>/.coverage", outputName: "junit.xml" }]],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  }
}