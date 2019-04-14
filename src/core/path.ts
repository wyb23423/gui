/**
 * 路径
 */

/// <reference path="../types.d.ts" />

import { Vector2 } from "../lib/vector";
import * as bbox from '../lib/bbox';
import { BoundingRect } from "./bounding_rect";

// =====================================
enum CMD {
    M = 1, // moveTo
    L = 2, // lineTo
    C = 3, // 三阶贝塞尔
    Q = 4, // 二阶贝塞尔
    A = 5, // arc
    Z = 6, // close
    R = 7 // rect
}

export class Path {
    static CMD = CMD;

    lineDash: number[] = [];

    private data: Nullable<Float32Array> = null;
    private _len: number = 0;

    private _ctx: Nullable<CanvasRenderingContext2D> = null;

    get context() {
        return this._ctx;
    }

    get len(){
        return this._len;
    }

    beginPath(ctx: CanvasRenderingContext2D){
        this._ctx = ctx;
        this._len = 0;

        if(ctx){
            ctx.beginPath();
            ctx.setLineDash(this.lineDash);
        }

        return this;
    }

    moveTo (x: number, y: number) {
        this.addData(CMD.M, x, y);
        this._ctx && this._ctx.moveTo(x, y);

        return this;
    }

    lineTo(x: number, y: number) {
        this.addData(CMD.L, x, y);
        this._ctx && this._ctx.lineTo(x, y);

        return this;
    }

    // 三阶贝塞尔曲线
    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        this.addData(CMD.C, x1, y1, x2, y2, x3, y3);

        this._ctx && this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);

        return this;
    }

    // 二阶贝塞尔曲线
    quadraticCurveTo(x1: number, y1: number, x2: number, y2: number) {
        this.addData(CMD.Q, x1, y1, x2, y2);

        this._ctx && this._ctx.quadraticCurveTo(x1, y1, x2, y2);

        return this;
    }

    /**
     * @param  anticlockwise // 规定应该逆时针还是顺时针绘图。1 = 顺时针，0 = 逆时针。
     */
    arc (
        c: number[] | number,
        r: number[] | number,
        startAngle: number,
        endAngle: number,
        rotation: number = 0,
        anticlockwise: 0 | 1 = 0
    ) {
        if(!Array.isArray(c)){
            c = [c, c];
        }
        if(!Array.isArray(r)){
            r = [r, r];
        }

        this.addData(CMD.A, c[0], c[1], r[0], r[1], startAngle, endAngle, rotation, anticlockwise);

        if(this._ctx){
            this._arc(this._ctx, c[0], c[1], r[0], r[1], startAngle, endAngle, rotation, anticlockwise)
        }

        return this;
    }

    rect (x: number, y: number, w: number, h: number) {
        this.addData(CMD.R, x, y, w, h);
        this._ctx && this._ctx.rect(x, y, w, h);

        return this;
    }

    closePath() {
        this.addData(CMD.Z);
        this._ctx && this._ctx.closePath();

        return this;
    }

    /**
     * 直接设置 Path 数据
     */
    setData(data: number[]) {
        const len = this._len = data.length;

        if(!this.data || this.data.length !== len){
            this.data = new Float32Array(len);
        }
        for(let i=0; i<len; i++){
            this.data[i] = data[i];
        }

        return this;
    }

    /**
     * 添加子路径
     */
    appendPath(path: Path | Path[]) {
        if(!Array.isArray(path)) path = [path];

        const appendSize = path.reduce((a, b) => a + b.len, 0);
        this.data = new Float32Array(this._len + appendSize);

        path.forEach(append => {
            if(append.data){
                for(let i=0; i<append.data.length; i++){
                    (<Float32Array>this.data)[this._len++] = append.data[i];
                }
            }
        });

        return this;
    }

    getBoundingRect() {
        const min = new Vector2(Number.MAX_VALUE);
        const max = new Vector2(-Number.MAX_VALUE);

        const data = this.data || [];

        let xi = 0;
        let yi = 0;
        let x0 = 0;
        let y0 = 0;

        for(let i = 0; i < this._len;){
            let min1 = new Vector2(Number.MAX_VALUE);
            let max1 = new Vector2(-Number.MAX_VALUE);

            if (!i) {
                // 如果第一个命令是 L, C, Q
                // 则 previous point 同绘制命令的第一个 point
                //
                // 第一个命令为 Arc 的情况下会在后面特殊处理
                xi = data[i + 1];
                yi = data[i +2];

                x0 = xi;
                y0 = yi;
            }

            switch(data[i++]) {
                case CMD.M:
                    min1.x = max1.x = xi = x0 = data[i++];
                    min1.y = max1.y = yi = y0 = data[i++];
                    break;
                case CMD.L:
                    [min1, max1] = bbox.line(xi, yi, data[i], data[i + 1]);
                    xi = data[i++];
                    yi = data[i++];
                    break;
                case CMD.C:
                    [min1, max1] = bbox.cubic(
                        xi, yi, data[i++], data[i++], data[i++], data[i++], data[i], data[i + 1]
                    );
                    xi = data[i++];
                    yi = data[i++];
                    break;
                case CMD.Q:
                    [min1, max1] = bbox.quadratic(xi, yi, data[i++], data[i++], data[i], data[i + 1]);
                    xi = data[i++];
                    yi = data[i++];
                    break;
                case CMD.A:
                    const isStart = i === 1;

                    const cx = data[i++];
                    const cy = data[i++];
                    const rx = data[i++];
                    const ry = data[i++];
                    const startAngle = data[i++];
                    const endAngle = data[i++];
                    i++;
                    const anticlockwise = 1 - data[i++];

                    if (isStart) {
                        // 直接使用 arc 命令
                        // 第一个命令起点还未定义
                        x0 = Math.cos(startAngle) * rx + cx;
                        y0 = Math.sin(startAngle) * ry + cy;
                    }

                    [min1, max1] = bbox.arc(cx, cy, rx, ry, startAngle, endAngle, anticlockwise);

                    xi = Math.cos(endAngle) * rx + cx;
                    yi = Math.sin(endAngle) * ry + cy;
                    break;
                case CMD.R:
                    x0 = xi = data[i++];
                    y0 = yi = data[i++];
                    [min1, max1] = bbox.line(xi, yi, xi + data[i++], yi + data[i++]);
                    break;
                case CMD.Z:
                    xi = x0;
                    yi = y0;
                    break;
            }

            min.toMin(min1);
            max.toMax(max1);
        }

        return new BoundingRect(min.x, min.y, max.x - min.x, max.y - min.y);
    }

    rebuildPath(ctx: CanvasRenderingContext2D) {
        const data = this.data || [];

        for(let i = 0; i < this._len;){
            switch(data[i++]) {
                case CMD.M:
                    ctx.moveTo(data[i++], data[i++]);
                    break;
                case CMD.L:
                    ctx.lineTo(data[i++], data[i++]);
                    break;
                case CMD.C:
                    ctx.bezierCurveTo(data[i++], data[i++], data[i++], data[i++], data[i++], data[i++]);
                    break;
                case CMD.Q:
                    ctx.quadraticCurveTo(data[i++], data[i++], data[i++], data[i++]);
                    break;
                case CMD.A:
                    this._arc(
                        ctx,
                        data[i++], data[i++], // 圆心
                        data[i++], data[i++], // 半轴长
                        data[i++], data[i++], // 起始及结束角
                        data[i++], // 旋转
                        data[i++]
                    );
                    break;
                case CMD.R:
                    ctx.rect(data[i++], data[i++], data[i++], data[i++]);
                    break;
                case CMD.Z:
                    ctx.closePath();
                    break;
                default:
                    console.error('data数据错误。未找到对应的绘图命令: ' + data[i - 1]);
                    return;
            }
        }
    }

    /**
     * 填充 Path 数据。
     * 尽量复用而不申明新的数组。大部分图形重绘的指令数据长度都是不变的。
     */
    private addData(...arg: number[]) {
        let data: Nullable<number[] | Float32Array> = this.data;

        if(!data || this._len + arg.length > data.length){
            data = this._expandData();
        }
        arg.forEach(v => (<number[] | Float32Array>data)[this._len++] = v);
        this.toStatic(data);

        return this;
    }

    private _expandData() {
        const newData = [];

        if(this.data){
            for(let i = 0; i < this._len; i++){
                newData[i] = this.data[i];
            }
        }

        return newData;
    }

    private toStatic(data: number[] | Float32Array) {
        if(Array.isArray(data)){
            data.length = this._len;
            this.data = new Float32Array(data);
        }
    }

    // 画一个圆弧
    private _arc(
        ctx: CanvasRenderingContext2D,
        cx: number, cy: number,
        rx: number, ry: number,
        startAngle: number, endAngle: number,
        rotation: number,
        anticlockwise: number,
    ){
        if(Math.abs(rx - ry) > Number.EPSILON * 2 ** 10){ // 椭圆
            ctx.save();

            const scaleX = rx > ry ? 1 : rx / ry;
            const scaleY = rx > ry ? ry / rx : 1;

            ctx.translate(cx, cy);
            ctx.rotate(rotation);
            ctx.scale(scaleX, scaleY);
            ctx.arc(0, 0, Math.max(rx, ry), startAngle, endAngle, !anticlockwise);

            ctx.restore();
        } else {
            ctx.arc(cx, cy, rx, startAngle, endAngle, !anticlockwise);
        }
    }
}