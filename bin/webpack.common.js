/*
* @Author: name
* @Date:   2018-10-21 16:45:12
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2019-04-10 21:43:23
*/

'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].bundle.js',
        chunkFilename: '[name].[chunkhash:8].bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({title: 'gui'})
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                include: path.resolve(__dirname, '../src')
            }
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
};