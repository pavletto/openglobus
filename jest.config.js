module.exports = {
    clearMocks: true,
    coverageDirectory: "coverage",
    collectCoverage: true,
    coverageProvider: "v8",
    setupFiles: ["jest-canvas-mock"],
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["./tests/setupTests.js"],
    moduleFileExtensions: ["ts", "js"],
    preset: 'ts-jest/presets/js-with-ts',
    testRegex: [
        "\\.test\\.js$",
        "\\.test\\.ts$",
    ],
    moduleNameMapper: {
        '\\.worker\\.js\\?worker&inline$': '<rootDir>/tests/__mocks__/workerMock.js',
        '\\.glsl$': '<rootDir>/tests/__mocks__/glslMock.js'
    }
};
