import type { AnnotationProperties, InputOptions } from '@actions/core'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
    test
} from "@jest/globals"
import { rm, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { cwd } from 'process'
import { correctObj, incorrectObj, tfInput } from '../.tests/inputs'

const mockDebug = jest.fn<(message: string) => void>()
const mockError = jest.fn<(message: string | Error, properties?: AnnotationProperties) => void>()
const mockGetInput = jest.fn<(name: string, options?: InputOptions | undefined) => string>()
const mockGetBooleanInput = jest.fn<(name: string, options?: InputOptions | undefined) => boolean>()
const mockSetVariable = jest.fn<(name: string, val: any) => void>()
const mockSetOutput = jest.fn<(name: string, value: any) => void>()
const mockSetSecret = jest.fn<(secret: string) => void>()
const mockSetFailed = jest.fn<(message: string | Error) => void>()

jest.unstable_mockModule("@actions/core", () => ({
    debug: mockDebug,
    error: mockError,
    getInput: mockGetInput,
    getBooleanInput: mockGetBooleanInput,
    exportVariable: mockSetVariable,
    setOutput: mockSetOutput,
    setSecret: mockSetSecret,
    setFailed: mockSetFailed,
}))

// Must be imported dynamically AFTER mocks are registered
const { runAction } = await import("./process-json.ts")

const TEST_FILE_NAME = ".ignore-sample-output"

describe("process json", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("should work with correct json and isTf = false", () => {
        // Arrange
        mockGetInput.mockReturnValueOnce('__')
        mockGetInput.mockReturnValueOnce(correctObj)
        // isTF
        mockGetBooleanInput.mockReturnValueOnce(false)
        // markAllSecrets
        mockGetBooleanInput.mockReturnValueOnce(false)

        // Act
        runAction()

        // Assert
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", { "required": false, "trimWhitespace": true })
        expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", { "required": true })
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(1, "isTerraformOutput")
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(2, "markAllOutputAsSecret")
        expect(mockSetVariable).toHaveBeenCalledTimes(5)
        expect(mockSetVariable).toHaveBeenNthCalledWith(1, "foo__bar__baz", "undefined")
        expect(mockSetVariable).toHaveBeenNthCalledWith(2, "foo__fub", "goz")
        expect(mockSetOutput).toHaveBeenCalledTimes(5)
        expect(mockSetSecret).not.toHaveBeenCalled()
        expect(mockSetFailed).not.toHaveBeenCalled()
    })

    it("should work with correct json, mark all output as secret and isTf = false", () => {
        // Arrange
        mockGetInput.mockReturnValueOnce('__')
        mockGetInput.mockReturnValueOnce(correctObj)
        // isTF
        mockGetBooleanInput.mockReturnValueOnce(false)
        // markAllSecrets
        mockGetBooleanInput.mockReturnValueOnce(true)

        // Act
        runAction()

        // Assert
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", { "required": false, "trimWhitespace": true })
        expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", { "required": true })
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(1, "isTerraformOutput")
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(2, "markAllOutputAsSecret")
        expect(mockSetVariable).toHaveBeenCalledTimes(5)
        expect(mockSetVariable).toHaveBeenNthCalledWith(1, "foo__bar__baz", "undefined")
        expect(mockSetVariable).toHaveBeenNthCalledWith(2, "foo__fub", "goz")
        expect(mockSetSecret).toHaveBeenCalledTimes(5)
        // ensure error wasn't thrown
        expect(mockError).not.toHaveBeenCalled()
        expect(mockSetFailed).not.toHaveBeenCalled()
    })

    it("should error with incorrect json", () => {
        // Arrange
        mockGetInput.mockReturnValueOnce('__')
        mockGetInput.mockReturnValueOnce(incorrectObj)
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockGetBooleanInput.mockReturnValueOnce(false)

        // Act
        runAction()

        // Assert
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", { "required": false, "trimWhitespace": true })
        expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", { "required": true })
        expect(mockSetFailed).toHaveBeenCalledTimes(1)
        expect(mockSetFailed).toHaveBeenCalledWith("Unable to parse jsonStringOrPath input. Not a valid JSON string.")
        expect(mockError).toHaveBeenCalledTimes(1)
        expect(mockSetVariable).not.toHaveBeenCalled()
    })

    test.each([
        // fileName, isString, isRelative, extension (in the `.ext` format)
        ["", true, false, ""],
        [TEST_FILE_NAME, false, true, ""],
        [TEST_FILE_NAME, false, false, ""],
        [".ignore-ext", false, false, ".ext"],
        [".ignore-json", false, true, ".json"],
    ])("Terraform Output (%s) using StringInput: %s, withRelativePath: %s, with extension: %s",
        async (fileName: string, isString: boolean, isRelative: boolean, extension: string) => {
            // Arrange
            let deferDelete: () => Promise<void> = async () => { }
            mockGetInput.mockReturnValueOnce('__')

            if (isString) {
                mockGetInput.mockReturnValueOnce(tfInput)
            } else {
                const file = isRelative
                    ? `${fileName}${extension}`
                    : resolve(cwd(), `${fileName}${extension}`)

                await writeFile(file, tfInput, { encoding: "utf-8" })
                deferDelete = async () => {
                    await rm(file).catch((ex) => {
                        console.error('failed clean up :>> ', ex)
                    })
                }
                mockGetInput.mockReturnValueOnce(file)
            }
            // isTF
            mockGetBooleanInput.mockReturnValueOnce(true)
            // markAllSecrets is ignored with TF Output
            mockGetBooleanInput.mockReturnValueOnce(false)

            try {
                // Act
                runAction()

                // Assert
                expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", { "required": false, "trimWhitespace": true })
                expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", { "required": true })
                expect(mockGetBooleanInput).toHaveBeenNthCalledWith(1, "isTerraformOutput")
                expect(mockGetBooleanInput).toHaveBeenNthCalledWith(2, "markAllOutputAsSecret")
                expect(mockSetVariable).toHaveBeenCalledTimes(11)
                // preserves existing behaviour of single level outputs
                expect(mockSetVariable).toHaveBeenNthCalledWith(1, "arr1", ["item1", "item2"])
                expect(mockSetVariable).toHaveBeenNthCalledWith(4, "complex1Level__key3", false)
                expect(mockSetVariable).toHaveBeenNthCalledWith(5, "complex2Level__key1__c2l_key1", "complex2Level")
                expect(mockSetVariable).toHaveBeenNthCalledWith(6, "complex2Level__key1__c2l_key2", 123)
                // ensure error wasn't thrown
                expect(mockError).not.toHaveBeenCalled()
                expect(mockSetFailed).not.toHaveBeenCalled()
            } finally {
                // always clean up, even if assertions fail
                await deferDelete()
            }
        })
})