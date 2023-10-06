module.exports = {
    // ...
    babel: {
        presets: [
            ['@babel/preset-env'],
            '@babel/preset-react',
        ],
        plugins: [
            ["@babel/plugin-proposal-decorators", { "version": "2018-09", "decoratorsBeforeExport": true }],
            ["@babel/plugin-transform-private-property-in-object", { "loose": true }],
            ["@babel/plugin-transform-private-methods", { "loose": true }],
            ["@babel/plugin-proposal-class-properties", { "loose": true }],
        ],
    },
};