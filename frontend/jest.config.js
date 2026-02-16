export default {
    testEnvironment: 'jsdom',
    transform: {
        "^.+\\.(js|jsx)$": "babel-jest",
    },
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy"
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testMatch: [
        "<rootDir>/src/tests/**/*.test.{js,jsx}"
    ],
    collectCoverageFrom: [
        "src/**/*.{js,jsx}",
        "!src/main.jsx",
        "!src/tests/**"
    ]
};
