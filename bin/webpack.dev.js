/*
* @Author: name
* @Date:   2018-10-21 16:46:20
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2019-05-08 14:16:26
*/

'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        hot: true,
        historyApiFallback: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({title: 'gui'})
    ],
});