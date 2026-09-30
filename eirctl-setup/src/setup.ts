import {
    addPath,
    debug,
    error,
    getBooleanInput,
    getInput
} from "@actions/core"
import { mv } from "@actions/io"
import { downloadTool, } from "@actions/tool-cache"
import { getErrorMessage, getErrorStack } from "@ensono-actions-lib/utils"
import crypto from "crypto"
import { chmod, readFile } from "fs/promises"
import { arch, platform } from "os"
import { dirname, join } from "path"

export type GHRelease = {
    tag_name: string,
    name: string,
    draft: boolean,
    prerelease: boolean,
}


export const parseConfig = () => {
    const version = getInput("version", {
        required: false,
        trimWhitespace: true,
    })
    const isPrerelease = getBooleanInput("isPrerelease", { required: false })
    const sha256 = getInput('sha256', { required: false, trimWhitespace: true })

    if ((version !== 'latest' && !sha256) || (isPrerelease && !sha256)) {
        throw new Error('The sha256 input is required when version is not latest.')
    }

    return {
        version,
        isPrerelease,
        sha256,
    }
}

export type SetupConfig = ReturnType<typeof parseConfig>

const RELEASES_BASE_URL = `https://github.com/Ensono/eirctl/releases`

const RELEASES_API_URL = `https://api.github.com/repos/Ensono/eirctl/releases`


const getOsArch = () => {
    // node os.Arch() values mapped to Go Build GOARCH
    const archValMap = {
        x32: '386',
        x64: "amd64",
        // fallback mapping for x32 architectures not covered by NodeJS.Architecture at current version
    } as Record<NodeJS.Architecture | 'x32', string>

    // node os.Platform() values mapped to Go Build GOOS
    const osValMap = {
        win32: "windows"
    } as Record<NodeJS.Platform, string>

    const [os, architecture] = [platform(), arch()]

    return {
        osName: osValMap[os] || os as string,
        archName: archValMap[architecture] || architecture as string,
    }
}

/**
 * getUrl looks for a specific release version 
 * 
 * version specific URL: https://github.com/Ensono/eirctl/releases/download/2.0.0/eirctl-linux-amd64
 * 
 * default latest release: https://github.com/Ensono/eirctl/releases/latest/download/eirctl-darwin-arm64
 * 
 * @param version 
 * @param os 
 * @param arch 
 * @returns 
 */
const getUrl = (config: Pick<SetupConfig, "version">, os: string, arch: string) => {
    return config.version == "latest" ?
        // latest version
        `${RELEASES_BASE_URL}/latest/download/eirctl-${os}-${arch}${os === "windows" ? ".exe" : ""}` :
        // specific version specified 
        `${RELEASES_BASE_URL}/download/${config.version}/eirctl-${os}-${arch}${os === "windows" ? ".exe" : ""}`
}

/**
 * pre-release version checks the prerelease URLs and looks for either the latest or a specific version
 * 
 * URL: https://api.github.com/repos/Ensono/eirctl/releases
 * @param version 
 * @returns 
 */
export const getPrereleaseVersion = async (config: Pick<SetupConfig, "version">) => {
    const resp = await fetch(RELEASES_API_URL, { method: "Get" }).catch((ex: Error) => {
        debug(getErrorStack(ex))
        throw new Error(`unable to fetch prerelease URL, ${getErrorMessage(ex)}`)
    })

    const prereleaseVersions = (await resp.json() as GHRelease[]).filter((f) => f.prerelease)
    if (prereleaseVersions?.length < 1) {
        throw new Error(`no prereleases found`)
    }

    if (config.version == "latest") {
        return prereleaseVersions[0].tag_name
    }

    const preVersion = prereleaseVersions.find((f) => f.tag_name == config.version)

    if (!!preVersion) {
        return preVersion.tag_name
    }
    throw new Error(`no prereleases found at version ${config.version}`)
}

const verifyChecksum = async (config: SetupConfig, filePath: string): Promise<void> => {
    const fileBuffer = await readFile(filePath)
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex")
    // sha256 can be supplied in both forms
    // 
    // sha256:0b749ebef493338aff5d16118371e5be70e393d1ae26c58b88f4ec1d852fcffd
    // or just 
    // 0b749ebef493338aff5d16118371e5be70e393d1ae26c58b88f4ec1d852fcffd
    if (hash !== config.sha256.replace("sha256:", "")) {
        throw new Error(`checksum verification failed for ${config.version}`)
    }
}

/**
 * downloads the specified binary and makes it executable
 * @param param0 
 */
const downloadBinary = async (config: SetupConfig): Promise<void> => {
    const { osName, archName } = getOsArch()
    // let { version, isPrerelease, sha256 } = config

    if (config.isPrerelease) {
        config.version = await getPrereleaseVersion(config).catch((ex) => {
            return Promise.reject(ex)
        }) as string
    }

    const url = getUrl(config, osName, archName)
    const pathToBin = await downloadTool(url).catch((ex: Error) => {
        throw new Error("unable to download tool, " + getErrorMessage(ex))
    })
    let target = join(dirname(pathToBin), "eirctl")
    await mv(pathToBin, target).catch((ex: Error) => {
        debug(getErrorMessage(ex))
        throw new Error("unable to move bin: " + pathToBin)
    })
    await chmod(target, 0o777).catch((ex: Error) => {
        debug(getErrorMessage(ex))
        throw new Error("unable to make executable: " + pathToBin)
    })
    if (config.sha256 !== "") {
        await verifyChecksum(config, target)
    }
    addPath(dirname(target))
}

/**
 * runTask
 * @returns
 * @description downloads and sets up eirctl on the host
 */
export const runAction = async (): Promise<void> => {
    return await downloadBinary(parseConfig()).catch((ex: Error) => {
        error(getErrorMessage(ex))
        debug(getErrorStack(ex))
        return Promise.reject(ex)
    })
}
