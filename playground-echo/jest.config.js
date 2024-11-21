const root = require("../jest.config")

module.exports = {
  ...root,
  // if needed add setup Files for env vars etc... 
  // runs before jest is hoisted globally
  setupFiles: [
    "<rootDir>/.testEnv.js"
  ],
  // 
  coverageThreshold: {
    "global": {
      "statements": 5,
      "branches": 5,
      "functions": 5,
      "lines": 8
    }
  },
  verbose: true
}
