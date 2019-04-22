/**
 * 节点基类
 */

import { Matrix, mul } from "../lib/matrix";
import { Layer } from "../layer";
import { Container } from "./container";
import { BoundingRect } from "../core/bounding_rect";
import { Style, Istyle } from "../core/style";
import { isZero } from "../tool/util";

export class Canvas2DElement {
    transform = new Matrix();
    parent?: Container;
    layer?: Layer;
    rect?: BoundingRect;

    style: Style = new Style();

    origin: number[] = [0, 0];

    width: number = 0;
    height: number = 0;

    private isVisible?: boolean = true; // 是否可见
    private _cached?: HTMLCanvasElement; // 缓存节点
    private _parentWidth: number = 0;
    private _parentHeight: number = 0;
    protected _isStatic: boolean = false; // 是否使用缓存绘制
    protected _cachedTransform?: Matrix; // 使用缓存绘制的变换矩阵

    constructor(public id: string | number, isStatic: boolean = false) {
        this._isStatic = isStatic;
    }

    get isStatic(){
        return this._isStatic;
    }

    set isStatic(isStatic: boolean){
        this._isStatic = isStatic;
    }

    dispose() {
        if(this.layer) {
            this.layer.remove(this);
        }

        if(this.parent){
            this.parent.remove(this);
        }

        this._cached
        = this.rect
        = this.transform
        = this.style
        = this.layer
        = this.parent = null;
    }

    async draw(ctx: CanvasRenderingContext2D){
        this.beforeUpdate();
        this.getBoundingRect();
        this.afterUpdate();

        if(this._isPaint(ctx.canvas.width, ctx.canvas.height)) {
            ctx.save();

            if(this._isStatic){
                if(!this._cached){
                    this._cached = await this.buildCached(this.width, this.height, ctx);
                } else {
                    this.setTransform(ctx, this._cachedTransform);
                }
                ctx.drawImage(this._cached, 0, 0, this._cached.width, this._cached.height);
            } else {
                this.setTransform(ctx);
                await this.build(ctx);
            }
            ctx.restore();

            this.afterBuild();
        }
    }

    /**
     * 设置节点样式
     */
    attr(key: string | Istyle, value?: any){
        if(this.style.set(key, value)){
            this.rect = null;
        }

        this.markDirty();
    }

    /**
     * 获取节点AABB类包围盒
     */
    getBoundingRect() {
        if(!this.rect) {
            this.update();

            this.rect = new BoundingRect(0, 0, this.width, this.height)
                            .transform(this.transform);
        }

        return this.rect;
    };

    setTransform(ctx: CanvasRenderingContext2D, transform: Matrix = this.transform){
        const {a, b, c, d, e, f} = transform;

        ctx.setTransform(a, b, c, d, e, f);
        ctx.translate(this.style.border / 2, this.style.border / 2);

        this.beforeBuild();
    }

    /**
     * 标记节点所在的层需要重绘
     */
    markDirty(){
        if(this.parent){
            this.parent.markDirty();
        }
        if(this.layer){
            this.layer.dirty = true;
        }
    }

    // ========================钩子函数
    beforeUpdate() {}

    update(){
        this._parentWidth = this._getBaseSize('width');
        this._parentHeight = this._getBaseSize('height');

        if(!(this._isStatic && this._cached)){
            const width = this.width = this._parseSize(this.style.width, 'width');
            const height = this.height = this._parseSize(this.style.height, 'height');

            this.style.border = Math.min(this.style.border || 0, width / 2, height / 2);

            this.origin[0] = this.style.origin[0] * width;
            this.origin[1] = this.style.origin[1] * height;
        }

        this._updateTransform();
    }

    afterUpdate(){}

    beforeBuild() {}
    build(ctx: CanvasRenderingContext2D) {}
    afterBuild() {}
    // =============================================================

    async buildCached(width: number, height: number, ctx: CanvasRenderingContext2D) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const cachedCtx = canvas.getContext('2d');
        cachedCtx.save();
        this.setTransform(cachedCtx);
        await this.build(cachedCtx);
        cachedCtx.restore();

        return canvas;
    }

    /**
     * 构建圆角矩形
     */
    protected buildRadiusPath(ctx: CanvasRenderingContext2D){
        const w = this.width - this.style.border;
        const h = this.height - this.style.border;

        let circleCount: number = 0;
        const radius = this.style.borderRadius.map((v, i) => {
            const base = i % 2 ? h : w;
            if(v <= 1) {
                v *= base;
            }
            v = Math.min(v, base / 2);
            if(isZero(v - base / 2)){
                circleCount++;
                v = base / 2;
            }

            return v;
        });

        if(circleCount >= 4){
            const r = radius[0]
            ctx.arc(r, r, r, 0, Math.PI * 2);
        } else {
            ctx.moveTo(0, h - radius[3]);

            ctx.arcTo(0, 0, w, 0, radius[0]);
            ctx.arcTo(w, 0, w, h, radius[1]);
            ctx.arcTo(w, h, 0, h, radius[2]);
            ctx.arcTo(0, h, 0, 0, radius[3]);
        }
    }

    private _updateTransform(){
        const style = this.style;

        let x: number, y: number;
        if(style.left != null) {
            x = this._parseSize(style.left, 'width');
        } else if(style.right != null){
            x = this._parentWidth - this._parseSize(style.right, 'width') - this.width;
        } else {
            x = this._parseSize('50%', 'width') - this.width / 2;
        }

        if(style.top != null) {
            y = this._parseSize(style.top, 'height');
        } else if(style.bottom != null){
            y = this._parentHeight - this._parseSize(style.bottom, 'height') - this.height;
        } else {
            y = this._parseSize('50%', 'height') - this.height / 2;
        }

        this.transform
            .toUnit()
            .translate(-this.origin[0], -this.origin[1])
            .scale(this.style.scale)
            .rotate(this.style.rotation)
            .translate(x + this.origin[0], y + this.origin[1]);

        if(this.parent){
            const parent = this.parent;
            this.transform
                .translate(parent.style.border, parent.style.border)
                .transform(parent.transform);
        }
    }

    private _parseSize(size: number | string, key: 'width'| 'height'): number {
        if(typeof size === 'string'){
            if(size.endsWith('%')){
                let base: number = 0;
                if(key === 'width') {
                    base = this._parentWidth;
                } else {
                    base = this._parentHeight;
                }

                return base * (parseFloat(size) || 0) / 100;
            } else {
                return parseFloat(size) || 0;
            }
        }

        return <number>size;
    }

    private _getBaseSize(key: 'width'| 'height'){
        let base: number = 0;
        if(this.parent) {
            base = this.parent[key];
            if(this.parent.style.border) {
                base -= this.parent.style.border * 2;
            }
        } else if(this.layer && this.layer.canvas){
            base = this.layer.canvas[key];
        }

        return base;
    }

    private _isPaint(rootWidth: number, rootHeight: number){
        let isPaint = this.isVisible && this.style.opacity && this.style.scale[0] && this.style.scale[1];

        if(isPaint) {
            const clipRect = this._getClipRect();
            if(clipRect){
                return this.rect.intersect(clipRect);
            }

            return this.rect.intersect(0, 0, rootWidth, rootHeight);
        }

        return false;
    }

    private _getClipRect(){
        let parent = this.parent;
        while(parent){
            if(parent.style.clip){
                return parent.rect;
            }

            parent = parent.parent;
        }
    }
}