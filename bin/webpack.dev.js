/*
* @Author: name
* @Date:   2018-10-21 16:46:20
* @Last Modified by:   name
* @Last Modified time: 2018-10-21 19:33:02
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
        historyApiFallback:true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
});