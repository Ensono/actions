import {
    addPath,
    debug,
    error,
    getBooleanInput,
    getInput
} from "@actions/core"
import { mv } from "@actions/io"
import { downloadTool } from "@actions/tool-cache"
import { chmod } from "fs/promises"
import { arch, platform } from "os"
import { dirname, join } from "path"

export type GHRelease = {
    tag_name:  string,
    name:  string,
    draft:  boolean,
    prerelease:  boolean,
}

export const parseConfig = () => {
    const version = getInput("version", {
        required: false,
        trimWhitespace: true,
    })
    const isPrerelease = getBooleanInput("isPrerelease", { required: false })
    return {
        version,
        isPrerelease,
    }
}

const RELEASES_BASE_URL = `https://github.com/Ensono/taskctl/releases`

const RELEASES_API_URL = `https://api.github.com/repos/Ensono/taskctl/releases`


const getOsArch = () => {
    // node os.Arch() values mapped to Go Build GOARCH
    const archValMap = {
        x32: '386',
        x64: "amd64",
    }

    // node os.Platform() values mapped to Go Build GOOS
    const osValMap = {
        win32: "windows"
    }

    const [os, architecture] = [ platform(), arch()]
    
    return {
        osName: osValMap[os] || os  as string,
        archName: archValMap[architecture] || architecture as string,
    }
}

/**
 * getUrl looks for a specific release version 
 * 
 * version specific URL: https://github.com/Ensono/taskctl/releases/download/2.0.0/taskctl-linux-amd64
 * 
 * default latest release: https://github.com/Ensono/taskctl/releases/latest/download/taskctl-darwin-arm64
 * 
 * @param version 
 * @param os 
 * @param arch 
 * @returns 
 */
const getUrl = (version: string, os: string, arch: string) => {
    return version == "latest" ? 
        // latest version
        `${RELEASES_BASE_URL}/latest/download/taskctl-${os}-${arch}${os === "windows" ? ".exe" : ""}` :
        // specific version specified 
        `${RELEASES_BASE_URL}/download/${version}/taskctl-${os}-${arch}${os === "windows" ? ".exe" : ""}`
}

/**
 * pre-release version checks the prerelease URLs and looks for either the latest or a specific version
 * 
 * URL: https://api.github.com/repos/Ensono/taskctl/releases
 * @param version 
 * @returns 
 */
export const getPrereleaseVersion = async (version: string) => {
    const resp = await fetch(RELEASES_API_URL, {method: "Get"}).catch((ex: Error) => {
        debug(ex.stack)
        throw new Error(`unable to fetch prerelease URL, ${ex.message}`)
    })

    const prereleaseVersions = (await resp.json() as GHRelease[]).filter((f) => f.prerelease)
    if (prereleaseVersions?.length < 1) {
        throw new Error("no prereleases found")
    }

    if (version == "latest") {
        return prereleaseVersions[0].tag_name
    }
    
    const preVersion = prereleaseVersions.find((f) => f.tag_name == version)
    
    if (!!preVersion) {
        return preVersion.tag_name
    }
    throw new Error(`no prereleases found at version ${version}`)
}


/**
 * downloads the specified binary and makes it executable
 * @param param0 
 */
const downloadBinary = async ({
    version,isPre 
} : {
    version: string; isPre: boolean 
}) => {
    const { osName, archName } = getOsArch()

    if (isPre) {
        version = await getPrereleaseVersion(version).catch((ex) => {
            return Promise.reject(ex)
        }) as string
    }

    const url = getUrl(version, osName, archName)
    const pathToBin = await downloadTool(url).catch((ex: Error) => {
        throw new Error("unable to download tool, " + ex.message)
    })
    let target = join(dirname(pathToBin), "taskctl")
    await mv(pathToBin, target).catch((ex: Error) => {
        debug(ex.message)
        throw new Error("unable to move bin: " + pathToBin)
    })
    await chmod(target, 0o777).catch((ex: Error) => {
        debug(ex.message)
        throw new Error("unable to make executable: " + pathToBin)
    })
    return target
}

/**
 * runTask
 * @returns
 * @description downloads and sets up taskctl on the host
 */
export const runAction = async () => {

    const { version, isPrerelease } = parseConfig()

    await downloadBinary({ 
        version, 
        isPre: isPrerelease
    })
    .then((pathToBin)=> {
        // addPath does not throw
        // (if for whatever reason it will, 
        // it would caught by callee (main/index) catch block)
        addPath(dirname(pathToBin))
    }).catch((ex: Error) =>{
        error(ex.message)
        debug(ex.stack)
        return Promise.reject(ex)
    })
}
