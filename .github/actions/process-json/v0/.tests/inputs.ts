export const tfInput = `{
    "arr1": {
        "sensitive": true,
        "type": [
            "tuple",
            [
                "string",
                "string"
            ]
        ],
        "value": [
            "item1",
            "item2"
        ]
    },
    "complex1Level": {
        "sensitive": false,
        "type": [
            "object",
            {
                "key1": "string",
                "key2": "number",
                "key3": "bool"
            }
        ],
        "value": {
            "key1": "complex1Level",
            "key2": 123,
            "key3": false
        }
    },
    "complex2Level": {
        "sensitive": false,
        "type": [
            "object",
            {
                "key1": [
                    "object",
                    {
                        "c2l_key1": "string",
                        "c2l_key2": "number",
                        "c2l_key3": "bool"
                    }
                ]
            }
        ],
        "value": {
            "key1": {
                "c2l_key1": "complex2Level",
                "c2l_key2": 123,
                "c2l_key3": false
            }
        }
    },
    "complex2Level_arr": {
        "sensitive": false,
        "type": [
            "object",
            {
                "key1": [
                    "object",
                    {
                        "c2larr_key1": [
                            "tuple",
                            [
                                "string",
                                "string"
                            ]
                        ],
                        "c2larr_key2": "number",
                        "c2larr_key3": "bool"
                    }
                ]
            }
        ],
        "value": {
            "key1": {
                "c2larr_key1": [
                    "i1",
                    "i2"
                ],
                "c2larr_key2": 123,
                "c2larr_key3": false
            }
        }
    },
    "simple": {
        "sensitive": false,
        "type": "string",
        "value": "some-id"
    }
}`

export const correctObj = `{
    "foo": {
        "bar": { "baz": "undefined" },
        "fub": "goz",
        "bag": { "zar": { "zaz": null }, "raz": 3 }
    },
    "arr": ["123", "456", "789"]
}`

export const incorrectObj = `{
    foo: {
        bar: { baz:  },
        fub: "goz",
        bag: { zar: { zaz: null }, raz: 3 },
    },
    arr: ["123", "456",
}`
