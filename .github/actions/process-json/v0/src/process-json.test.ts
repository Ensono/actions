import * as mockSrv from '@actions/core'
import { rm, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { cwd } from 'process'
import { correctObj, incorrectObj, tfInput } from '../.tests/inputs'
import { runAction } from "./process-json"

const TEST_FILE_NAME = ".ignore-sample-output"
describe("process json", () => {
    let mockDebug: jest.SpyInstance<void, [message: string], any>
    let mockError: jest.SpyInstance<void, [message: string | Error, properties?: mockSrv.AnnotationProperties], any>
    let mockGetInput: jest.SpyInstance<string, [name: string, options?: mockSrv.InputOptions], any>
    let mockGetBooleanInput: jest.SpyInstance<boolean, [name: string, options?: mockSrv.InputOptions], any>
    let mockSetVariable: jest.SpyInstance<void, [name: string, val: any], any>
    let mockSetFailed: jest.SpyInstance<void, [message: string | Error], any>
    
    beforeEach(() => {
        mockDebug = jest.spyOn(mockSrv, "debug").mockImplementation(() => {})
        mockError = jest.spyOn(mockSrv, "error").mockImplementation(() => {})
        mockGetInput = jest.spyOn(mockSrv, 'getInput')
        mockGetBooleanInput = jest.spyOn(mockSrv, 'getBooleanInput')
        mockSetVariable = jest.spyOn(mockSrv, 'exportVariable').mockImplementation(() => {})
        mockSetFailed = jest.spyOn(mockSrv, 'setFailed').mockImplementation(() => {})
    })

    afterEach(async () => {
        mockGetInput.mockClear()
        mockGetBooleanInput.mockClear()
        mockSetVariable.mockClear()
        mockDebug.mockClear()
        mockError.mockClear()
    });
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
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", {"required": false, "trimWhitespace": true});
        expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", {"required": true});
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(1, "isTerraformOutput");
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(2, "markAllOutputAsSecret");
        expect(mockSetVariable).toHaveBeenCalledTimes(5)
        expect(mockSetVariable).toHaveBeenNthCalledWith(1, "foo__bar__baz", "undefined");
        expect(mockSetVariable).toHaveBeenNthCalledWith(2, "foo__fub", "goz");
        // expect(mockSetResult).toHaveBeenCalledWith(0, "Processed entire input", true);
        // expect(mockSetResult).toHaveBeenCalledTimes(1)
        // ensure error wasn't thrown
        // expect(mockSetResult).not.toHaveBeenCalledWith(1, "", true)
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
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", {"required": false, "trimWhitespace": true});
        expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", {"required": true});
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(1, "isTerraformOutput");
        expect(mockGetBooleanInput).toHaveBeenNthCalledWith(2, "markAllOutputAsSecret");
        expect(mockSetVariable).toHaveBeenCalledTimes(5)
        expect(mockSetVariable).toHaveBeenNthCalledWith(1, "foo__bar__baz", "undefined");
        expect(mockSetVariable).toHaveBeenNthCalledWith(2, "foo__fub", "goz");
        // expect(mockSetResult).toHaveBeenCalledWith(0, "Processed entire input", true);
        // expect(mockSetResult).toHaveBeenCalledTimes(1)
        // ensure error wasn't thrown
        expect(mockError).not.toHaveBeenCalled()
        // expect(mockSetResult).not.toHaveBeenCalledWith(1, "", true)
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
        expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", {"required": false, "trimWhitespace": true});
        expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", {"required": true});
        // should error on above
        expect(mockSetFailed).toHaveBeenCalledTimes(1)
        expect(mockSetFailed).toHaveBeenCalledWith("Unable to parse jsonStringOrPath input. Not a valid JSON string.")
        expect(mockError).toHaveBeenCalled()
        expect(mockError).toHaveBeenCalledTimes(1)
        // expect(mockDebug).toHaveBeenCalledTimes(0)
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
            let deferDelete: () => Promise<void>
            mockGetInput.mockReturnValueOnce('__')

            if (isString){
                mockGetInput.mockReturnValueOnce(tfInput)
                deferDelete = async () => {}
            } else {
                let file = isRelative ? `${fileName}${extension}` : resolve(cwd(), `${fileName}${extension}`) 
                
                console.log('file :>> ', file);

                await writeFile(file, tfInput, {encoding: "utf-8"}).catch((ex) => {
                    console.error('unable to write file :>> ', ex?.message);
                    expect(ex).toBe(null)
                })
                deferDelete = async () => {
                    console.log('deleting file :>> ', file);
                    await rm(file).catch((ex) => {
                        console.error('failed clean up :>> ', ex);
                    })
                }
                mockGetInput.mockReturnValueOnce(file)
            }
            // isTF
            mockGetBooleanInput.mockReturnValueOnce(true)
            // markAllSecrets is ignored with TF Output
            mockGetBooleanInput.mockReturnValueOnce(false)

            // Act
            runAction()

            // Assert
            expect(mockGetInput).toHaveBeenNthCalledWith(1, "separator", {"required": false, "trimWhitespace": true});
            expect(mockGetInput).toHaveBeenNthCalledWith(2, "jsonStringOrPath", {"required": true});
            expect(mockGetBooleanInput).toHaveBeenNthCalledWith(1, "isTerraformOutput");
            expect(mockGetBooleanInput).toHaveBeenNthCalledWith(2, "markAllOutputAsSecret");
            // 
            expect(mockSetVariable).toHaveBeenCalledTimes(11)
            // preserves existing behaviour of single level outputs
            // respects sensitive true
            expect(mockSetVariable).toHaveBeenNthCalledWith(1, "arr1", ["item1", "item2"]);
            expect(mockSetVariable).toHaveBeenNthCalledWith(4, "complex1Level__key3", false);
            expect(mockSetVariable).toHaveBeenNthCalledWith(5, "complex2Level__key1__c2l_key1", "complex2Level");
            expect(mockSetVariable).toHaveBeenNthCalledWith(6, "complex2Level__key1__c2l_key2", 123);
            // expect(mockSetResult).toHaveBeenCalledWith(0, "Processed entire input", true);
            // expect(mockSetResult).toHaveBeenCalledTimes(1)
            // ensure error wasn't thrown
            expect(mockError).not.toHaveBeenCalled()
            
            // custom run deferred
            await deferDelete()
    })
})
