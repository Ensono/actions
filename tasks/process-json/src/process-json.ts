import { debug, error, exportVariable, getBooleanInput, getInput, setFailed, setOutput, setSecret } from "@actions/core"
import { existsSync, readFileSync } from "fs"
import { parse } from "path"
import { cwd } from "process"

export const parseConfig = () => {
    const separator = getInput("separator", { required: false , trimWhitespace: true} )
    const jsonStringOrPath = getInput("jsonStringOrPath", { required: true})
    const isTerraformJson = getBooleanInput("isTerraformOutput")
    const markAllOutputAsSecret = getBooleanInput("markAllOutputAsSecret")
    let parsedJson: any
    let jsonString = jsonStringOrPath
    try {
        let parsedPath = parse(jsonStringOrPath)
        // the task should run in the root of the repo
        // relative paths should work the same way
        debug(`cwd: ${cwd()}`)
        debug(`parsed path dir: ${parsedPath?.dir}`)
        debug(`parsed path name: ${parsedPath?.name}`)
        debug(`parsed file ext: ${parsedPath?.ext}`)
        if (existsSync(jsonStringOrPath)) {
            debug(`file found: ${jsonStringOrPath}`)
            jsonString = readFileSync(jsonStringOrPath, {
                encoding: "utf-8",
            })
        }
        parsedJson = JSON.parse(jsonString)
    } catch (ex) {
        error(
            `unable to parse jsonStringOrPath(${jsonStringOrPath}): ${ex.message}`
        )
        throw new Error(
            `Unable to parse jsonStringOrPath input. Not a valid JSON string.`
        )
    }
    return {
        separator,
        parsedJson,
        isTerraformJson,
        markAllOutputAsSecret,
    }
}

type TfOutput = { value: any; sensitive: boolean; type: string }
type OutputMap = { path: string; val: any | TfOutput }

/**
 *
 * Recursively builds a list of objects
 * containing the deepest possible concatanted key and its value.
 *
 * Value (`val`) can be a tf output object or
 * any primitive in case of non tfOutput object type.
 * @returns
 */
export const flattenObject = ({
    obj,
    isTfOut,
    separator,
}: {
    obj: Record<string, any>
    isTfOut: boolean
    separator: string
}): OutputMap[] => {
    const isObject = (val: any) => {
        return val && typeof val === "object" && !Array.isArray(val)
    }

    /**
     * sets specified delimiter
     * @param a
     * @param b
     * @returns
     */
    const addDelimiter = (a: string, b: string) => {
        return a ? `${a}${separator}${b}` : b
    }

    /**
     * use function keyword to hoist
     * @param obj
     * @param head
     * @returns
     */
    function paths(obj: any = {}, head: string = "") {
        return Object.entries(obj).reduce((flattened, [key, value]) => {
            let path = addDelimiter(head, key)
            if (isTfOut && (key == "type" || key == "sensitive"))
                return flattened
            let val = isTfOut ? (value as any)?.value || value : value
            return isObject(val)
                ? flattened.concat(paths(val, path))
                : flattened.concat({ path, val })
        }, [])
    }

    return paths(obj)
}

/**
 * 
 * @param parsedJson 
 * @param fullPath 
 * @param separator 
 */
const checkSensitivityOfOutput = (parsedJson: any, fullPath: string, separator: string): boolean => {
    const topLevel = parsedJson[fullPath.split(separator)[0]]
    return !!topLevel?.sensitive
}

const setOutputVars = (name: string, val: string, isSecret: boolean) => {
    // settting the value secret  
    if (isSecret) 
        setSecret(val)
    
    // set both export vars and outputs
    exportVariable(name,val)
    setOutput(name, val)
}


/**
 * runTask
 * @returns
 * @description Flattens the input and processes each item
 * according to specified user input on the task.
 */
export const runAction = () => {
    try {
        const {
            parsedJson,
            isTerraformJson,
            separator,
            markAllOutputAsSecret,
        } = parseConfig()
        const flattened = flattenObject({
            obj: parsedJson,
            isTfOut: isTerraformJson,
            separator,
        })
        debug(
            `found following keys: ${flattened.map((v) => v.path).join("\n")}`
        )
        for (const output of flattened) {
            if (isTerraformJson) {
                setOutputVars(output.path, output.val, checkSensitivityOfOutput(parsedJson, output.path, separator))
                continue
            }
            setOutputVars(output.path, output.val, markAllOutputAsSecret)
        }
    } catch (ex) {
        debug(ex.stack)
        setFailed(ex?.message)
    }
}

