import { describe, expect, test } from "@jest/globals"
import { getErrorMessage, getErrorStack } from "."

describe("actions-helper", () => {
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