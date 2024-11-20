import * as mockSrv from '@actions/core'
import { rm } from 'fs/promises'
import { join } from 'path'
import { env } from 'process'
import { runAction } from "./setup"


describe("setup succeeds", () => {
    let mockDebug: jest.SpyInstance<void, [message: string], any>
    let mockError: jest.SpyInstance<void, [message: string | Error, properties?: mockSrv.AnnotationProperties], any>
    let mockGetInput: jest.SpyInstance<string, [name: string, options?: mockSrv.InputOptions], any>
    let mockGetBooleanInput: jest.SpyInstance<boolean, [name: string, options?: mockSrv.InputOptions], any>
    beforeEach(() => {
        mockDebug = jest.spyOn(mockSrv, "debug").mockImplementation(() => {})
        mockError = jest.spyOn(mockSrv, "error").mockImplementation(() => {})
        mockGetInput = jest.spyOn(mockSrv, 'getInput')
        mockGetBooleanInput = jest.spyOn(mockSrv, 'getBooleanInput')
    })

    afterEach(async () => {
        mockGetInput.mockClear()
        mockGetBooleanInput.mockClear()
        mockDebug.mockClear()
        mockError.mockClear()
    });

   test("use default latest", async () => {
        // Arrange 
        mockGetInput.mockReturnValueOnce("latest")
        mockGetInput.mockReturnValueOnce(".taskctl")
        // isTF
        mockGetBooleanInput.mockReturnValueOnce(false)
        let tmpRunnerDir = env.RUNNER_TEMP || env.TMPDIR
        env.RUNNER_TEMP = tmpRunnerDir
        let err = null
        // Act 
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert 
        expect(err).toBe(null)

        expect(env?.PATH?.split(":")).toContain(tmpRunnerDir?.substring(0, tmpRunnerDir.length-1))

        await rm(join(tmpRunnerDir as string, "taskctl"))
   })
})
