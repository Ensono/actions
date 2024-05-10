
module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.ts"],
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  reporters: [
    "default"
  ],
  preset: "ts-jest",
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.coverage/",
    "<rootDir>/templates/",
    "<rootDir>/dist/"
  ],
  coverageReporters: ["json"],
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
    "!<rootDir>/src/**/*.interface.ts",
    "!<rootDir>/src/**/*.mock.ts",
    "!<rootDir>/src/**/*.module.ts",
    "!<rootDir>/src/**/*.spec.ts",
    "!<rootDir>/src/**/*.test.ts",
    "!<rootDir>/src/**/*.d.ts"
  ],
  coverageDirectory: "<rootDir>/.coverage",
  coverageThreshold: {
    "global": {
      "statements": 89,
      "branches": 90,
      "functions": 85,
      "lines": 88
    }
  },
  reporters: [ 
    "default", 
   [ "jest-junit", {
      usePathForSuiteName: true, 
      suiteNameTemplate:"{filename}", 
      classNameTemplate: "{classname}-{title}",
      titleTemplate: "{classname}-{title}",
      outputName: ".coverage/junit.xml",
      ancestorSeparator: " > "
    } ]
  ],
  verbose: true
}
