/*
* @Author: name
* @Date:   2018-10-21 16:46:20
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2019-04-20 22:22:46
*/

'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        hot: true,
        historyApiFallback: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
});