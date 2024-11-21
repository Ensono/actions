jest.mock("os")
jest.mock("fs/promises")
// actions write to stdout silence here
global.process.stdout.write = jest.fn(() => true)

import * as mockSrv from "@actions/core"
import * as mockIO from "@actions/io"
import * as mockTools from "@actions/tool-cache"
import { OutgoingHttpHeaders } from "http"
import { join } from "path"
import { env } from "process"
import { runAction } from "./setup"

// need to use require here to ensure it can be overridden
const os = require("os")
const fs = require("fs/promises")

describe("taskctl setup", () => {
    let mockDebug: jest.SpyInstance<void, [message: string], any>
    let mockError: jest.SpyInstance<
        void,
        [message: string | Error, properties?: mockSrv.AnnotationProperties],
        any
    >
    let mockGetInput: jest.SpyInstance<
        string,
        [name: string, options?: mockSrv.InputOptions],
        any
    >
    let mockGetBooleanInput: jest.SpyInstance<
        boolean,
        [name: string, options?: mockSrv.InputOptions],
        any
    >
    let mockDownload: jest.SpyInstance<
        Promise<string>,
        [
            url: string,
            dest?: string | undefined,
            auth?: string | undefined,
            headers?: OutgoingHttpHeaders | undefined
        ],
        any
    >
    let mockMV: jest.SpyInstance<
        Promise<void>,
        [
            source: string,
            dest: string,
            options?: mockIO.MoveOptions | undefined
        ],
        any
    >
    let mockFetch: jest.SpyInstance<
        Promise<Response>,
        [input: RequestInfo | URL, init?: RequestInit | undefined],
        any
    >
    let tmpRunnerDir: string

    beforeEach(() => {
        mockDebug = jest.spyOn(mockSrv, "debug").mockImplementation(() => {})
        mockError = jest.spyOn(mockSrv, "error").mockImplementation(() => {})
        mockGetInput = jest
            .spyOn(mockSrv, "getInput")
            .mockImplementation(() => {
                throw new Error("Not Mocked")
            })
        mockGetBooleanInput = jest
            .spyOn(mockSrv, "getBooleanInput")
            .mockImplementation(() => {
                throw new Error("Not Mocked")
            })
        mockDownload = jest
            .spyOn(mockTools, "downloadTool")
            .mockImplementation(async () => {
                throw new Error("Not Mocked")
            })
        mockMV = jest.spyOn(mockIO, "mv").mockImplementation(async () => {
            throw new Error("Not Mocked")
        })
        mockFetch = jest.spyOn(global, "fetch").mockImplementation(async () => {
            throw new Error("Not Mocked")
        })

        // local vs GHA run unit tests
        tmpRunnerDir =
            env.RUNNER_TEMP || (env.TMPDIR?.replace(/\/$/, "") as string)
        env.RUNNER_TEMP = tmpRunnerDir
    })

    afterEach(async () => {
        mockGetInput.mockClear()
        mockGetBooleanInput.mockClear()
        mockDebug.mockClear()
        mockError.mockClear()
        mockDownload.mockClear()
        // mockFs.mockClear()
    })

    test.each([
        // version,arc,os,expectUrl
        ["latest", "amd64", "darwin", "latest/download/taskctl-darwin-amd64"],
        ["latest", "arm64", "darwin", "latest/download/taskctl-darwin-arm64"],
        ["latest", "x64", "win32", "latest/download/taskctl-windows-amd64.exe"],
        ["latest", "x32", "win32", "latest/download/taskctl-windows-386.exe"],
        ["latest", "x64", "linux", "latest/download/taskctl-linux-amd64"],
        ["1.0.2", "amd64", "darwin", "download/1.0.2/taskctl-darwin-amd64"],
        ["2.0.0", "arm64", "darwin", "download/2.0.0/taskctl-darwin-arm64"],
        ["1.0.2", "x64", "win32", "download/1.0.2/taskctl-windows-amd64.exe"],
        ["1.0.2", "x32", "win32", "download/1.0.2/taskctl-windows-386.exe"],
        ["1.0.23", "x64", "linux", "download/1.0.23/taskctl-linux-amd64"],
    ])(
        "stable release successfully fetches binary with version (%s) using arch (%s) on platform(%s)",
        async (version, osArch, osPlatform, expectString) => {
            // Arrange
            mockGetInput.mockReturnValueOnce(version)
            // isPre
            mockGetBooleanInput.mockReturnValueOnce(false)
            let tmpName = `random-${new Date().valueOf()}`
            mockDownload.mockImplementationOnce(async () => {
                return join(tmpRunnerDir, tmpName)
            })
            mockMV.mockImplementationOnce(async () => {
                return
            })

            fs.chmod = jest.fn(async() => {})
            os.platform = jest.fn().mockReturnValue(osPlatform)
            os.arch = jest.fn().mockReturnValue(osArch)

            let err = null
            // Act
            await runAction().catch((ex) => {
                err = ex
            })
            // Assert
            expect(err).toBe(null)
            // ensure we have added the install location to the path
            expect(env?.PATH?.split(":")).toContain(tmpRunnerDir)
            expect(mockDownload).toHaveBeenCalledWith(
                `https://github.com/Ensono/taskctl/releases/${expectString}`
            )
        }
    )
    test.each([
        // version,arc,os,expectUrl
        ["latest", "amd64", "darwin", "download/1.8.0/taskctl-darwin-amd64"],
        ["latest", "arm64", "darwin", "download/1.8.0/taskctl-darwin-arm64"],
        ["latest", "x64", "win32", "download/1.8.0/taskctl-windows-amd64.exe"],
        ["latest", "x32", "win32", "download/1.8.0/taskctl-windows-386.exe"],
        ["latest", "x64", "linux", "download/1.8.0/taskctl-linux-amd64"],
        ["1.0.2", "amd64", "darwin", "download/1.0.2/taskctl-darwin-amd64"],
        ["2.0.0", "arm64", "darwin", "download/2.0.0/taskctl-darwin-arm64"],
        ["1.0.2", "x64", "win32", "download/1.0.2/taskctl-windows-amd64.exe"],
        ["1.0.2", "x32", "win32", "download/1.0.2/taskctl-windows-386.exe"],
        ["1.0.23", "x64", "linux", "download/1.0.23/taskctl-linux-amd64"],
    ])(
        "prerelease mode successfully fetches binary with version (%s) using arch (%s) on platform(%s)",
        async (version, osArch, osPlatform, expectString) => {
            // Arrange
            mockGetInput.mockReturnValueOnce(version)
            // isPre
            mockGetBooleanInput.mockReturnValueOnce(true)
            let tmpName = `random-${new Date().valueOf()}`

            mockDownload.mockImplementationOnce(async () => {
                return join(tmpRunnerDir, tmpName)
            })
            mockMV.mockImplementationOnce(async () => {
                return
            })

            fs.chmod = jest.fn(async() => {})
            os.platform = jest.fn().mockReturnValue(osPlatform)
            os.arch = jest.fn().mockReturnValue(osArch)

            mockFetch.mockImplementationOnce(async () => {
                return {
                    ...{} as Response,
                    json: async () => { return [
                            {
                                tag_name: "1.7.1",
                                target_commitish: "master",
                                name: "1.7.1",
                                draft: false,
                                prerelease: false,
                            },
                            {
                                tag_name: "1.8.0",
                                target_commitish: "master",
                                name: "1.8.0",
                                draft: false,
                                prerelease: true,
                            },
                            {
                                tag_name: "1.8.1",
                                target_commitish: "master",
                                name: "1.8.1",
                                draft: false,
                                prerelease: false,
                            },
                            {
                                tag_name: version,
                                target_commitish: "master",
                                name: version,
                                draft: false,
                                prerelease: true,
                            },
                        ]
                    },
                }
            })

            let err = null
            // Act
            await runAction().catch((ex) => {
                err = ex
            })
            // Assert
            expect(err).toBe(null)
            // ensure we have added the install location to the path
            expect(env?.PATH?.split(":")).toContain(tmpRunnerDir)
            expect(mockDownload).toHaveBeenCalledWith(
                `https://github.com/Ensono/taskctl/releases/${expectString}`
            )
        }
    )

    // negative test cases
    test("fails on prerelease REST call", async () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(true)
        mockFetch.mockImplementationOnce(async () => {
            throw new Error("mocked err")
        })

        os.platform = jest.fn().mockReturnValue("foo")
        os.arch = jest.fn().mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message.startsWith("unable to fetch prerelease URL")).toBe(true)
        }
    })
    test("no prereleases exist", async () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(true)
        mockFetch.mockImplementationOnce(async () => {
            return {
                ...{} as Response,
                json: async () => { return [
                        {
                            tag_name: "1.7.1",
                            target_commitish: "master",
                            name: "1.7.1",
                            draft: false,
                            prerelease: false,
                        },
                        {
                            tag_name: "1.8.1",
                            target_commitish: "master",
                            name: "1.8.1",
                            draft: false,
                            prerelease: false,
                        },
                    ]
                },
            }
        })
        os.platform = jest.fn().mockReturnValue("foo")
        os.arch = jest.fn().mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message.startsWith("no prereleases found")).toBe(true)
        }
    })

    test("no prereleases at version specified", async () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("2.7.1")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(true)
        mockFetch.mockImplementationOnce(async () => {
            return {
                ...{} as Response,
                json: async () => { return [
                        {
                            tag_name: "1.7.1",
                            target_commitish: "master",
                            name: "1.7.1",
                            draft: false,
                            prerelease: true,
                        },
                        {
                            tag_name: "1.8.1",
                            target_commitish: "master",
                            name: "1.8.1",
                            draft: false,
                            prerelease: true,
                        },
                    ]
                },
            }
        })
        os.platform = jest.fn().mockReturnValue("foo")
        os.arch = jest.fn().mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message.startsWith("no prereleases found at version 2.7.1")).toBe(true)
        }
    })

    test("download tool fails", async() => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockDownload.mockImplementationOnce(async () => {
            throw new Error("mocked err")
        })
        os.platform = jest.fn().mockReturnValue("foo")
        os.arch = jest.fn().mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message.startsWith("unable to download tool,")).toBe(true)
        }
    })
    test("moving tool fails", async() => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockDownload.mockImplementationOnce(async () => {
            return "/some/path/taskctl"
        })

        fs.chmod = jest.fn(async() => {})

        os.platform = jest.fn().mockReturnValue("foo")
        os.arch = jest.fn().mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message).toBe("unable to move bin: /some/path/taskctl")
        }
    })
    test("chmod-ing tool fails", async() => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockDownload.mockImplementationOnce(async () => {
            return "/some/path/taskctl"
        })
        mockMV.mockImplementationOnce(async () => {})
        fs.chmod = jest.fn(async() => {throw new Error("mocked err")})

        os.platform = jest.fn().mockReturnValue("foo")
        os.arch = jest.fn().mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message).toBe("unable to make executable: /some/path/taskctl")
        }
    })
})
