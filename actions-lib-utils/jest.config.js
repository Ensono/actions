const root = require("../jest.config")

module.exports = {
  ...root,
  // if needed add setup Files for env vars etc... 
  // runs before jest is hoisted globally
  setupFiles: [],
  coverageThreshold: {
    "global": {
      ...root.coverageThreshold.global,
      "branches": 83,
    }
  },
  verbose: true
}
