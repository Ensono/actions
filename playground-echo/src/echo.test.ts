import { InputOptions } from '@actions/core'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest
} from "@jest/globals"


const mockDebug = jest.fn<(message: string) => void>()
const mockGetInput = jest.fn<(name: string, options?: InputOptions | undefined) => string>()
const mockGetBooleanInput = jest.fn<(name: string, options?: InputOptions | undefined) => boolean>()
const mockgetMultilineInput = jest.fn<(name: string, options?: InputOptions | undefined) => string[]>()
const mockSetFailed = jest.fn<(message: string) => void>()

jest.unstable_mockModule("@actions/core", () => ({
    debug: mockDebug,
    getInput: mockGetInput,
    getBooleanInput: mockGetBooleanInput,
    getMultilineInput: mockgetMultilineInput,
    setFailed: mockSetFailed
}))


// import { parseConfig } from './echo'
const { parseConfig, runTask } = await import("./echo.ts")

describe('Echo tests', () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        mockGetInput.mockClear()
        mockGetBooleanInput.mockClear()
        mockgetMultilineInput.mockClear()
        mockSetFailed.mockClear()
        mockDebug.mockClear()
    })

    afterEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        mockGetInput.mockClear()
        mockGetBooleanInput.mockClear()
        mockgetMultilineInput.mockClear()
        mockSetFailed.mockClear()
    })

    it('should match when required', () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("some foo")
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockgetMultilineInput.mockReturnValueOnce(["packing", "picking", "otherfoo"])

        // Act
        runTask()

        // Assert
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "input1", { "required": true })
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(1, "inputBool", { "required": false })
        expect(mockgetMultilineInput).toHaveBeenCalledWith("input2StrArrComma", { "required": false })
        expect(mockDebug).toHaveBeenCalledWith(`config: ${JSON.stringify({ input2StrArrComma: ["packing", "picking", "otherfoo"],input1: "some foo", inputBool: false })}`)
    })
    it('should throw when required is missing', () => {
        // Arrange
        mockGetInput.mockImplementationOnce(() => { throw new Error('Input does not meet YAML 1.2 "Core Schema" specification') })
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockgetMultilineInput.mockReturnValueOnce([])
        let err = null
        // Act
        runTask()

        // Assert
        expect(mockSetFailed).toHaveBeenCalled()
        expect(mockSetFailed).toHaveBeenCalledWith(expect.stringContaining('Input does not meet YAML 1.2 "Core Schema" specification'))
    })
})
