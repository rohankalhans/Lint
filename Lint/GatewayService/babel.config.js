module.exports = function (api) {
    api.cache(true)

    const presets = [
        '@babel/preset-env',
    ]

    '@babel/polyfill'

    const plugins = [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-transform-arrow-functions'
    ]

    return {
        presets,
        plugins
    }
}
