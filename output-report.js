const libReport = require('istanbul-lib-report')
const { createCoverageMap, createFileCoverage } = require('istanbul-lib-coverage')
const reports = require('istanbul-reports')
const mergedRaw = require('./.combined-raw.json')
const path = require('node:path')

let map = createCoverageMap()

for (const fk of Object.keys(mergedRaw)) {
  const fileMarker = '/file:'
  const markerIndex = fk.lastIndexOf(fileMarker)
  const sourcePath =
    markerIndex >= 0 ? fk.slice(markerIndex + fileMarker.length) : fk
  const reportKey = path.relative(__dirname, path.resolve(sourcePath))

  const coverage = createFileCoverage({
    ...mergedRaw[fk],
    path: reportKey,
  })
  map.merge(createCoverageMap({ [reportKey]: coverage }))
}

// create a context for report generation
const context = libReport.createContext({
  dir: './.coverage',
  defaultSummarizer: "nested",
  coverageMap: map, //.files().forEach((f) => )
  // this is the map which we generated in above snippet
})

// create an instance of the relevant report class, passing the
// report name e.g. json/html/html-spa/text
const reportHtml = reports.create('html')

const reportJunit = reports.create('cobertura')
// call execute to synchronously create and write the report to disk
reportHtml.execute(context)

reportJunit.execute(context)
