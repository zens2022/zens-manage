export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/app.js'
    ],
    coverageDirectory: 'coverage',
    verbose: true
};
