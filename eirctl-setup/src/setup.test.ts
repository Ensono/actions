import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test
} from "@jest/globals"

import type { InputOptions } from "@actions/core"
import type { MoveOptions } from "@actions/io"
import type { OutgoingHttpHeaders } from "node:http"
import { join } from "node:path"
import process, { env } from "node:process"

const mockAddPath = jest.fn<(inputPath: string) => void>()
const mockDebug = jest.fn<(message: string) => void>()
const mockError = jest.fn<(message: string) => void>()
const mockGetInput = jest.fn<(name: string, options?: InputOptions | undefined) => string>()
const mockGetBooleanInput = jest.fn<(name: string, options?: InputOptions | undefined) => boolean>()
const mockDownload = jest.fn<(url: string, dest?: string | undefined, auth?: string | undefined, headers?: OutgoingHttpHeaders | undefined) => Promise<string>>()
const mockMV = jest.fn<(source: string, dest: string, options?: MoveOptions | undefined) => Promise<void>>()
const mockFetch = jest.fn<(input: string | URL | Request, init?: RequestInit | undefined) => Promise<Response>>()

jest.unstable_mockModule("@actions/core", () => ({
    addPath: mockAddPath,
    debug: mockDebug,
    error: mockError,
    getInput: mockGetInput,
    getBooleanInput: mockGetBooleanInput,
}))

jest.unstable_mockModule("@actions/tool-cache", () => ({
    downloadTool: mockDownload,
}))

jest.unstable_mockModule("@actions/io", () => ({
    mv: mockMV,
}))

const mockOs = {
    arch: jest.fn<() => string>(),
    platform: jest.fn<() => string>(),
}

const mockFs = {
    chmod: jest.fn<(path: string, mode: number) => Promise<void>>(),
}

jest.unstable_mockModule("os", () => mockOs)
jest.unstable_mockModule("fs/promises", () => mockFs)

process.stdout.write = jest.fn(() => true)

// import { runAction } from "./setup"
const { runAction } = await import("./setup.ts")

describe("eirctl setup", () => {
    let tmpRunnerDir: string

    beforeEach(() => {
        jest.clearAllMocks()

        mockFs.chmod.mockResolvedValue(undefined)
        mockOs.platform.mockReturnValue("darwin")
        mockOs.arch.mockReturnValue("x64")

        mockDebug.mockReturnValue()
        mockError.mockImplementation(() => { })
        mockGetInput.mockReturnValue("latest")
        mockGetBooleanInput.mockReturnValue(false)
        mockDownload.mockResolvedValue("/tmp/eirctl")
        mockMV.mockResolvedValue(undefined)
        // mockFetch.mockResolvedValue(new Response())
        jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch)

        // local vs GHA run unit tests
        tmpRunnerDir =
            env.RUNNER_TEMP || "/some/download/dir" as string
        env.RUNNER_TEMP = tmpRunnerDir
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        mockAddPath.mockClear()
        mockGetInput.mockClear()
        mockGetBooleanInput.mockClear()
        mockDebug.mockClear()
        mockError.mockClear()
        mockDownload.mockClear()
        mockMV.mockClear()
        mockFs.chmod.mockClear()
        mockOs.arch.mockClear()
        mockOs.platform.mockClear()
    })

    test.each([
        // version,arc,os,expectUrl
        ["latest", "amd64", "darwin", "latest/download/eirctl-darwin-amd64"],
        ["latest", "arm64", "darwin", "latest/download/eirctl-darwin-arm64"],
        ["latest", "x64", "win32", "latest/download/eirctl-windows-amd64.exe"],
        ["latest", "x32", "win32", "latest/download/eirctl-windows-386.exe"],
        ["latest", "x64", "linux", "latest/download/eirctl-linux-amd64"],
        ["1.0.2", "amd64", "darwin", "download/1.0.2/eirctl-darwin-amd64"],
        ["2.0.0", "arm64", "darwin", "download/2.0.0/eirctl-darwin-arm64"],
        ["1.0.2", "x64", "win32", "download/1.0.2/eirctl-windows-amd64.exe"],
        ["1.0.2", "x32", "win32", "download/1.0.2/eirctl-windows-386.exe"],
        ["1.0.23", "x64", "linux", "download/1.0.23/eirctl-linux-amd64"],
    ])(
        "stable release successfully fetches binary with version (%s) using arch (%s) on platform(%s)",
        async (version, osArch, osPlatform, expectString) => {
            // Arrange
            mockGetInput.mockReturnValueOnce(version)
            // isPre
            mockGetBooleanInput.mockReturnValueOnce(false)
            let tmpName = `random-${new Date().valueOf()}`
            mockDownload.mockResolvedValueOnce(join(tmpRunnerDir, tmpName))
            mockMV.mockResolvedValueOnce(undefined)

            mockFs.chmod.mockResolvedValue(undefined)
            mockOs.platform.mockReturnValue(osPlatform)
            mockOs.arch.mockReturnValue(osArch)

            let err = null
            // Act
            await runAction().catch((ex) => {
                err = ex
            })
            // Assert
            expect(err).toBe(null)
            // ensure we have added the install location to the path
            expect(mockAddPath).toHaveBeenCalledWith(tmpRunnerDir)
            expect(mockDownload).toHaveBeenCalledWith(
                `https://github.com/Ensono/eirctl/releases/${expectString}`
            )
        }
    )
    test.each([
        // version,arc,os,expectUrl
        ["latest", "amd64", "darwin", "download/1.8.0/eirctl-darwin-amd64"],
        ["latest", "arm64", "darwin", "download/1.8.0/eirctl-darwin-arm64"],
        ["latest", "x64", "win32", "download/1.8.0/eirctl-windows-amd64.exe"],
        ["latest", "x32", "win32", "download/1.8.0/eirctl-windows-386.exe"],
        ["latest", "x64", "linux", "download/1.8.0/eirctl-linux-amd64"],
        ["1.0.2", "amd64", "darwin", "download/1.0.2/eirctl-darwin-amd64"],
        ["2.0.0", "arm64", "darwin", "download/2.0.0/eirctl-darwin-arm64"],
        ["1.0.2", "x64", "win32", "download/1.0.2/eirctl-windows-amd64.exe"],
        ["1.0.2", "x32", "win32", "download/1.0.2/eirctl-windows-386.exe"],
        ["1.0.23", "x64", "linux", "download/1.0.23/eirctl-linux-amd64"],
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

            mockFs.chmod.mockResolvedValue(undefined)
            mockOs.platform.mockReturnValue(osPlatform)
            mockOs.arch.mockReturnValue(osArch)

            mockFetch.mockImplementationOnce(async () => {
                return {
                    ...{} as Response,
                    json: async () => {
                        return [
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
            expect(mockAddPath).toHaveBeenCalledWith(tmpRunnerDir)
            expect(mockDownload).toHaveBeenCalledWith(
                `https://github.com/Ensono/eirctl/releases/${expectString}`
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

        mockOs.platform.mockReturnValue("foo")
        mockOs.arch.mockReturnValue("bar")
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
                json: async () => {
                    return [
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
        mockOs.platform.mockReturnValue("foo")
        mockOs.arch.mockReturnValue("bar")
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
                json: async () => {
                    return [
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
        mockOs.platform.mockReturnValue("foo")
        mockOs.arch.mockReturnValue("bar")
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

    test("download tool fails", async () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockDownload.mockRejectedValueOnce(new Error("mocked err"))
        mockOs.platform.mockReturnValue("foo")
        mockOs.arch.mockReturnValue("bar")
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
    test("moving tool fails", async () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockDownload.mockResolvedValueOnce("/some/path/eirctl")

        mockFs.chmod.mockResolvedValue(undefined)
        mockMV.mockRejectedValue(new Error("mocked err"))
        mockOs.platform.mockReturnValue("foo")
        mockOs.arch.mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message).toBe("unable to move bin: /some/path/eirctl")
        }
    })
    test("chmod-ing tool fails", async () => {
        // Arrange
        mockGetInput.mockReturnValueOnce("latest")
        // isPre
        mockGetBooleanInput.mockReturnValueOnce(false)
        mockDownload.mockImplementationOnce(async () => {
            return "/some/path/eirctl"
        })
        mockMV.mockImplementationOnce(async () => { })
        mockFs.chmod.mockRejectedValue(new Error("mocked err"))
        mockOs.platform.mockReturnValue("foo")
        mockOs.arch.mockReturnValue("bar")
        let err = null
        // Act
        await runAction().catch((ex) => {
            err = ex
        })
        // Assert
        expect(err).not.toBe(null)
        if (err != null) {
            expect(err).toBeInstanceOf(Error)
            expect((err as Error)?.message).toBe("unable to make executable: /some/path/eirctl")
        }
    })
})
