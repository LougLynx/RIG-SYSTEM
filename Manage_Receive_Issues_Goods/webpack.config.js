const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
    entry: {
        calendarReceiveTLIP: './wwwroot/js/tlip/calendarReceiveTLIP.js',
        calendarIssuesTLIP: './wwwroot/js/tlip/calendarIssuesTLIP.js',
        calendarReceiveDenso: './wwwroot/js/denso/calendarReceiveDenso.js',
        calendarIssuesDenso: './wwwroot/js/denso/calendarIssuesDenso.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'wwwroot/dist/js')
    },
    module: {
        rules: [
            {
                test: /\.(?:js|mjs|cjs)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()]
    },
    plugins: [
        new WebpackObfuscator({
            rotateStringArray: true
        }, [])
    ],
    mode: 'production',
    devtool: 'source-map'
};
