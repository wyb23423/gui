/**
 * 节点基类
 */

import { Matrix } from "../lib/matrix";
import { Layer } from "../layer";
import { Container } from "./container";
import { BoundingRect } from "../core/bounding_rect";
import { Style, Istyle } from "../core/style";
import { ellipse, parseSize } from "../core/dom";
import { Canvas2DAnimation } from "../animation/animation";
import { EventFul, IGuiEvent } from "../core/event";

export class Canvas2DElement {
    readonly type: string = 'element';

    index: number = 0; // 在父容器内部的添加顺序

    transform = new Matrix();
    event = new EventFul();
    parent?: Container;
    layer?: Layer;
    rect?: BoundingRect;

    style: Style = new Style();
    origin: number[] = [0, 0];
    width: number = 0;
    height: number = 0;

    checkedPoint: Map<string, boolean> = new Map(); // 已检测过是否包含的点及其结果

    needUpdate: boolean = true;

    private _animation?: Canvas2DAnimation;

    private _parentWidth: number = 0;
    private _parentHeight: number = 0;

    private isVisible: boolean = true; // 是否可见
    private _ignore: boolean = true; // 最近一次绘制是否忽略了此节点的绘制

    private _dirty: boolean = true;

    protected _cached?: HTMLCanvasElement; // 缓存节点
    protected _cachedTransform?: Matrix; // 使用缓存绘制时的变换矩阵的逆矩阵

    protected _isStatic: boolean = false; // 是否使用缓存绘制

    constructor(public id: string | number, isStatic: boolean = false) {
        this._isStatic = isStatic;
    }

    get isStatic(){
        return this._isStatic;
    }

    set isStatic(isStatic: boolean){
        this._isStatic = isStatic;
    }

    get animation() {
        return this._animation;
    }

    set animation(animation: Canvas2DAnimation) {
        if(animation !== this._animation) {
            if(this._animation) {
                this._animation.el.delete(this);
            }

            this._animation = animation;
            animation && animation.addElement(this);
        }
    }

    dispose() {
        if(this.layer) {
            this.layer.remove(this, false);
        }

        if(this.parent){
            this.parent.remove(this, false);
        }

        this.event.dispose();
        this.style.dispose();
        if(this._animation) {
            this._animation.el.delete(this);
        }

        this._cached
        = this._animation
        = this.rect
        = this.transform
        = this.style
        = this.layer
        = this.parent
        = this.style = null;
    }

    async draw(ctx: CanvasRenderingContext2D){
        this.beforeUpdate();
        await this.getBoundingRect();
        this.afterUpdate();

        if(this._isPaint(ctx.canvas.width, ctx.canvas.height)) {
            ctx.save();
            this.style.setAlpha(ctx);

            if(this._isStatic){
                if(!this._cached){
                    this._cached = await this.buildCached(this.width, this.height, ctx);
                }
                const transform = this._cachedTransform
                                    ? new Matrix().copy(this._cachedTransform).transform(this.transform)
                                    : this.transform;
                this.setTransform(ctx, transform);
                ctx.drawImage(this._cached, 0, 0, this._cached.width, this._cached.height);
            } else {
                this._cachedTransform = null;
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
        if(typeof key === 'string') {
            key = {[key]: value};
        }

        let isEqual: boolean = true;
        for(const [k, v] of Object.entries(key)){
            if(!this.style.equal(k, v)) {
                isEqual = false;
                break;
            }
        }

        if(!isEqual) {
            if(this.style.set(key, value)){
                this.needUpdate = true;
            }

            this.markDirty();
        }

        return this;
    }

    /**
     * 获取节点AABB类包围盒
     */
    async getBoundingRect() {
        if(this.needUpdate) {
            await this.update();

            this.rect = new BoundingRect(0, 0, this.width, this.height)
                            .transform(this.transform);

            this.needUpdate = false;
        }

        return this.rect;
    };

    /**
     * 标记节点所在的层需要重绘
     */
    markDirty(){
        if(!this._dirty) {
            this._dirty = true;
            if(this.parent){
                this.parent.markDirty();
            }
            if(this.layer){
                this.layer.dirty = true;
            }
        }
    }


    notifyEvent(type: string, event: Event, guiEvent: IGuiEvent) {
        const skip = this.event.notify(type, event, guiEvent, this);

        if(!skip && this.parent) {
            this.parent.notifyEvent(type, event, guiEvent);
        }
    }

    // ========================钩子函数
    beforeUpdate() {
        this._ignore = true;
    }

    async update(){
        this._parentWidth = this._getBaseSize('width');
        this._parentHeight = this._getBaseSize('height');

        if(!(this._isStatic && this._cached)){
            await this.calcSize();
            this.style.border = Math.min(this.style.border, this.width / 2, this.height / 2);
            if(this.style.border < 0){
                this.style.border = 0;
            }

            this.origin[0] = this.style.origin[0] * this.width;
            this.origin[1] = this.style.origin[1] * this.height;
        }

        this._updateTransform();

        this.checkedPoint.clear();
    }

    afterUpdate(){
        this._dirty = false;
    }

    beforeBuild() {}

    async build(ctx: CanvasRenderingContext2D) {
        const border = this.style.border;
        const width = this.width - border;
        const height = this.height - border;

        this.buildPath(ctx, 0, 0, width, height);
        await this.style.build(ctx, width, height);

        if(border){
            ctx.stroke();

            if(this.style.background){
                this.buildPath(ctx, border / 2, border / 2, width - border, height - border);
            }
        }

        if(this.style.background){
            ctx.fill();
        }
    }
    afterBuild() {
        this._ignore = false;
    }
    // =============================================================

    async buildCached(width: number, height: number, ctx: CanvasRenderingContext2D) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const cachedCtx = canvas.getContext('2d');
        cachedCtx.save();
        await this.build(cachedCtx);
        cachedCtx.restore();

        return canvas;
    }

    /**
     * 仅创建路径, 不绘制, 可用于检测一个点是否在节点内部
     */
    buildPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number){
        ctx.beginPath();
        if(this.style.borderRadius){
            this.buildRadiusPath(ctx, x, y, width, height);
        } else {
            ctx.rect(x, y, width, height);
        }
        ctx.closePath();
    }

    getTarget(ctx: CanvasRenderingContext2D, x: number, y: number){
        if(this._contain(ctx, x, y)){
            return <Canvas2DElement>this;
        }

        return false;
    }

    async calcSize(){
        this.width = parseSize(this.style.width, this._parentWidth);
        this.height = parseSize(this.style.height, this._parentHeight);
    }

    setTransform(ctx: CanvasRenderingContext2D, transform: Matrix = this.transform){
        const {a, b, c, d, e, f} = transform;

        ctx.transform(a, b, c, d, e, f);
        ctx.translate(this.style.border / 2, this.style.border / 2);

        this.beforeBuild();
    }

    /**
     * 检测一个点是否落在此节点上
     * 未落在父节点上的点全视为未落在此节点上(减少遍历检测的次数)
     */
    protected _contain(ctx: CanvasRenderingContext2D, x: number, y: number){
        if(this._ignore) {
            return false;
        }

        const pk: string = `${x}_${y}`;
        if(this.checkedPoint.has(pk)) {
            return this.checkedPoint.get(pk);
        }

        if(this.rect && !this.rect.contain(x, y)) {
            this.checkedPoint.set(pk, false);
            return false;
        }

        const clipParent = this._getClipParent();
        if(clipParent) {
            const border = clipParent.style.border;

            ctx.setTransform(clipParent.transform);
            ctx.translate(border, border);
            clipParent.buildPath(ctx, 0, 0, clipParent.width - border * 2, clipParent.height - border * 2);

            if(!ctx.isPointInPath(x, y)) {
                this.checkedPoint.set(pk, false);

                return false;
            }
        }

        ctx.setTransform(this.transform);
        this.buildPath(ctx, 0, 0, this.width, this.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const result = ctx.isPointInPath(x, y);
        this.checkedPoint.set(pk, result);

        return result;
    }

    /**
     * 构建圆角矩形。性能消耗较大, 应减少使用, 或静态时使用
     *
     * 在 border存在 时圆角处会出现缝隙
     * 且 border越大 缝隙越大
     */
    protected buildRadiusPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number){
        const radius = this.style.borderRadius.map(v => {
            const res = [v, v];
            if(v <= 1) {
                res[0] *= w;
                res[1] *= h;
            }
            res[0] = Math.min(res[0], w / 2);
            res[1] = Math.min(res[1], h / 2);

            return res;
        });

        ctx.moveTo(x + w, y + radius[1][1]);

        // 右上
        ellipse(ctx, x + w - radius[1][0], y + radius[1][1], radius[1][0], radius[1][1], 0, -Math.PI / 2, 0, 0);
        // 上
        if(Math.abs(radius[0][0] - w + radius[1][0]) > 1e-3){
            ctx.lineTo(x + radius[0][0], y);
        }

        // 左上
        ellipse(ctx, x + radius[0][0], y + radius[0][1], radius[0][0], radius[0][1], -Math.PI / 2, Math.PI, 0, 0);
        // 左
        if(Math.abs(h - radius[0][1] - radius[3][1]) > 1e-3) {
            ctx.lineTo(x, y + h - radius[3][1]);
        }

        // 左下
        ellipse(ctx, x + radius[3][0], y + h - radius[3][1], radius[3][0], radius[3][1], Math.PI, Math.PI / 2, 0, 0);
        // 下
        if(Math.abs(w - radius[2][0] - radius[3][0]) > 1e-3) {
            ctx.lineTo(x + w - radius[2][0], y + h);
        }

        // 右下
        ellipse(ctx, x + w - radius[2][0], y + h - radius[2][1], radius[2][0], radius[2][1], Math.PI / 2, 0, 0, 0);
        // 右
        if(Math.abs(radius[1][1] - h + radius[2][1]) > 1e-3) {
            ctx.lineTo(x + w, y + radius[1][1]);
        }
    }

    private _updateTransform(){
        const style = this.style;

        let x: number, y: number;
        if(style.left != null) {
            x = parseSize(style.left, this._parentWidth);
        } else if(style.right != null){
            x = this._parentWidth - parseSize(style.right, this._parentWidth) - this.width;
        } else {
            x = parseSize('50%', this._parentWidth) - this.width / 2;
        }

        if(style.top != null) {
            y = parseSize(style.top, this._parentHeight);
        } else if(style.bottom != null){
            y = this._parentHeight - parseSize(style.bottom, this._parentHeight) - this.height;
        } else {
            y = parseSize('50%', this._parentHeight) - this.height / 2;
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
        if(
            this.isVisible
            && this.style.opacity
            && this.style.scale[0]
            && this.style.scale[1]
            && this.width >= 0
            && this.height >= 0
        ) {
            const clipParent = this._getClipParent();
            if(clipParent){
                return this.rect.intersect(clipParent.rect);
            }

            return this.rect.intersect(0, 0, rootWidth, rootHeight);
        }

        return false;
    }

    private _getClipParent(){
        let parent = this.parent;
        while(parent){
            if(parent.style.clip){
                return parent;
            }

            parent = parent.parent;
        }
    }
}