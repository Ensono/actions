import { describe, expect, test } from "@jest/globals"
import { getErrorMessage, getErrorStack } from "."
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

describe("actions-helper", () => {
    test("error stacks map to the original TypeScript line", () => {
        const error = new Error("source-map regression")
        const sourceLine = readFileSync(new URL(import.meta.url), "utf8")
            .split("\n")
            .findIndex(line => line.trim().startsWith('const error = new Error("source-map regression")')) + 1

        expect(sourceLine).toBeGreaterThan(0)
        expect(getErrorStack(error)).toContain(`${fileURLToPath(import.meta.url)}:${sourceLine}:`)
    })

    test.each([
        [new Error("Test error message"), "Test error message"],
        ["not error object", "not error object"]
    ])(
        "getErrorMessage should return the correct error message",
        (error, want) => {
            // Arrange

            // Act
            const errorMessage = getErrorMessage(error)

            // Assert
            expect(errorMessage).toBe(want)
        })

    test.each([
        [new Error("Test error message")],
        ["not error object"]
    ])(
        "getStackMessage should return the stack",
        (error) => {
            // Arrange

            // Act
            const errorMessage = getErrorStack(error)

            // Assert
            expect(errorMessage).not.toBe("")
        })
})  