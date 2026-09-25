export const getErrorMessage = (error: unknown): string => {
    return error instanceof Error
        ? error.message
        : String(error)
}

export const getErrorStack = (error: unknown): string => {
    return error instanceof Error
        ? error?.stack || "no stack available"
        : String(error)
}