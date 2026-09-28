import { debug, getBooleanInput, getInput, getMultilineInput, setFailed } from "@actions/core"

/**
 * parseConfig could be split into its own package in libs
 * 
 * Using an adapter in conjunction with strategy pattern from user
 * to supply resolution func for each property
 * @returns 
 */
export const parseConfig = () => {
    const input1 = getInput("input1", {required: true})
    const inputBool = getBooleanInput("inputBool", {required: false})
    return {
        input2StrArrComma: getMultilineInput("input2StrArrComma", {required: false}),
        input1,
        inputBool
    }
}


export const runTask = () => {
    let config: Opts
    try {
        config = parseConfig()
        debug(`config: ${JSON.stringify(config)}`)
    } catch (ex: unknown) {
        return setFailed(`unable to parse input: ${(ex as Error)?.message}`);
    }
}

export type Opts = ReturnType<typeof parseConfig>
