const nodeExternals = require('webpack-node-externals')
const path = require('path')

module.exports = {
    devtool: 'source-map',
    entry: './src/index.js',
    externals: [nodeExternals()],
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    query: {
                        presets: ['@babel/preset-env']
                    }
                },
            }
        ]
    },
    node: {
        __dirname: false
    },
    output: {
        path: path.join(__dirname, 'dist/'),
        publicPath: './',
        filename: 'index.compiled.js'
    },
    stats: {
        colors: true
    },
    target: 'node'
}
