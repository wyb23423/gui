/*
* @Author: name
* @Date:   2018-10-21 16:45:12
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2019-05-08 13:58:52
*/

'use strict';

const path = require('path');

module.exports = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'ws-gui.js',
        library: 'wsGui',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                include: path.resolve(__dirname, '../src')
            },
            {
                test: /\.(png|svg|jpg|gif|jpeg)$/,
                use: 'url-loader?limit=50000&name=assets/[hash:8].[name].[ext]'
            }
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx", ".json"],
        alias: {
            'src': path.resolve(__dirname, '../src/')
        }
    }
};