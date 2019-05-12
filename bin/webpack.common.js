/*
* @Author: name
* @Date:   2018-10-21 16:45:12
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2019-05-12 23:17:39
*/

'use strict';

const path = require('path');
const distPath = path.resolve(__dirname, '../dist');
const srcParh = path.resolve(__dirname, '../src');

module.exports = {
    entry: './src/index.ts',
    output: {
        path: distPath,
        filename: 'ws-gui.js',
        library: 'wsGui',
        libraryTarget: 'umd',
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                include: srcParh
            },
            {
                test: /\.(png|svg|jpg|gif|jpeg)$/,
                use: 'url-loader?limit=50000&name=assets/[name].[hash:8].[ext]'
            },
            {
                test: /\.worker\.js$/,
                loader: 'worker-loader',
                options: { inline: true },
                include: srcParh
            },
            {
                test: /\.worker\.tsx?$/,
                use: [
                    {
                        loader: 'worker-loader',
                        options: {
                            publicPath: 'worker',
                            inline: true,
                            name: 'worker/[name].[hash:8].js',
                        }
                    },
                    'ts-loader'
                ],
                include: srcParh
            },
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx", ".json"]
    }
};