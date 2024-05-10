import * as mockSrv from '@actions/core'
import { afterEach, expect, it } from '@jest/globals'
import { parseConfig } from './echo'

describe('Echo tests', () => {
    let mockDebug = jest.spyOn(mockSrv, "debug").mockImplementation(() => {})

    let mockGetInput = jest.spyOn(mockSrv, 'getInput')
    let mockGetBoolInput = jest.spyOn(mockSrv, "getBooleanInput")
    let mochGetDelimitedInput = jest.spyOn(mockSrv, 'getMultilineInput')
    let mockSetVariable = jest.spyOn(mockSrv, 'exportVariable').mockImplementation(() => {})

    beforeEach(() => {
        // mockDebug = jest.spyOn(mockSrv, "debug").mockImplementation(() => {})
        // setResultMock.mockImplementation(() => {})
    })

    afterEach(() => {
        mockGetInput.mockClear()
        mochGetDelimitedInput.mockClear()
        mockSetVariable.mockClear()
    });

    it('should match when required', () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("some foo")
        mockGetBoolInput.mockReturnValueOnce(false)
        mochGetDelimitedInput.mockReturnValueOnce(["packing","picking","otherfoo"])
        
        // Act
        let config = parseConfig()

        // Assert
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "input1");
        expect(mockGetBoolInput).toHaveBeenNthCalledWith(1, "inputBool",  {"required": false});
        expect(mochGetDelimitedInput).toHaveBeenCalledWith("input2StrArrComma",  {"required": false});
        expect(config.inputBool).toBe(false)
    });
    it('should throw when required is missing', () => {
        // Arrange
        let err = null
        // Act
        try {
            parseConfig()
        } catch(ex) {
            err = ex
        }

        // Assert
        expect(err).not.toBe(null)
        expect((err as any).message?.startsWith('Input does not meet YAML 1.2 "Core Schema" specification')).toBe(true)
    });
});
