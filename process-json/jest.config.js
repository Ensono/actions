const root = require("../jest.config")

module.exports = {
  ...root,
  // if needed add setup Files for env vars etc... 
  // runs before jest is hoisted globally
  setupFiles: [
    "<rootDir>/.testEnv.js"
  ],
  coverageThreshold: {
    "global": {
      ...root.coverageThreshold.global,
      "statements": 98,
      "lines": 98,
      "branches": 91,
    }
  },
  verbose: true
}
