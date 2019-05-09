/**
 * 路径
 */

import { Path as SuperPath } from "../core/path";
import { Canvas2DElement } from "./element";

export class Path extends Canvas2DElement {
    private _path = new SuperPath();

    moveTo (x: number, y: number) {
        this._path.moveTo(x, y);

        return this;
    }

    lineTo(x: number, y: number) {
        this._path.lineTo(x, y);

        return this;
    }

    // 三阶贝塞尔曲线
    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        this._path.bezierCurveTo(x1, y1, x2, y2, x3, y3);

        return this;
    }

    // 二阶贝塞尔曲线
    quadraticCurveTo(x1: number, y1: number, x2: number, y2: number) {
        this._path.quadraticCurveTo(x1, y1, x2, y2);

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
        this._path.arc(c, r, startAngle, endAngle, rotation, anticlockwise);

        return this;
    }

    rectPath (x: number, y: number, w: number, h: number) {
        this._path.rect(x, y, w, h);

        return this;
    }

    closePath() {
        this._path.closePath();

        return this;
    }

    /**
     * 直接设置 Path 数据
     */
    setData(data: number[]) {
        this._path.setData(data);

        return this;
    }

    /**
     * 添加子路径
     */
    appendPath(path: SuperPath | SuperPath[]) {
        this._path.appendPath(path);

        return this;
    }

    async build(ctx: CanvasRenderingContext2D) {
        if(!this._path.len) {
            return;
        }

        this.buildPath(ctx);
        await this.style.build(ctx, this.width, this.height);

        if(this.style.background){
            ctx.fill();
        }

        ctx.stroke();
    }

    async buildCached() {
        const canvas = document.createElement('canvas');
        canvas.width = this.getParentSize('width');
        canvas.height = this.getParentSize('height');

        const cachedCtx = canvas.getContext('2d');
        cachedCtx.save();
        await this.build(cachedCtx);
        cachedCtx.restore();

        return canvas;
    }

    async getBoundingRect() {
        if(this._needUpdate) {
            await this.update();
            this.rect.transform(this.transform);
            this._needUpdate = false;
        }

        return this.rect;
    };

    beforeUpdate() {
        super.beforeUpdate();
        this.style.border = this.style.border || 1;
    }

    async calcSize(){
        const rect = this._path.getBoundingRect();
        this.width = rect.w;
        this.height = rect.h;

        rect.w += this.style.border;
        rect.h += this.style.border;
        this.rect = rect;
    }

    updateTransform() {
        this.transform.toUnit();

        if(this.parent) {
            this.transform.transform(this.parent.transform);
        }
    }

    protected buildPath(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        this._path.rebuildPath(ctx);
    }
}