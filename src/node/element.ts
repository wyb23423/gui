/**
 * 节点基类
 * 各尺寸尽可能为偶数
 */

import { Matrix } from "../lib/matrix";
import { Layer } from "../layer";
import { Container } from "./container";
import { BoundingRect } from "../core/bounding_rect";
import { Style, Istyle } from "../core/style";
import { parseSize } from "../core/dom";
import { Canvas2DAnimation } from "../animation/animation";
import { EventFul, IGuiEvent, EventType } from "../core/event";
import { createId } from "../tool/util";
import { buildPath } from "../tool/paint";
import { Vector2 } from "../lib/vector";

export class Canvas2DElement {
    readonly type: string = 'element';

    index: number = 0; // 在父容器内部的添加顺序
    parent?: Container;
    layer?: Layer;

    transform = new Matrix();
    rect?: BoundingRect;
    events = new EventFul();

    isVisible: boolean = true; // 是否可见
    style: Style = new Style();
    origin: number[] = [0, 0]; // update时计算出的变换中心
    width: number = 0; // 通过calcSize计算出的width
    height: number = 0; // 通过calcSize计算出的height
    left?: number; // 存在时覆盖style.left设置
    top?: number;// 存在时覆盖style.top设置

    protected _needUpdate: boolean = true; // 是否需要执行update
    protected _cached?: HTMLCanvasElement; // 缓存节点
    private _hadCalc: boolean = false;

    private _animation?: Canvas2DAnimation;
    private _parentWidth: number = 0;
    private _parentHeight: number = 0;

    private _ignore: boolean = true; // 最近一次绘制是否忽略了此节点的绘制
    private _dirty: boolean = true;
    private _checkedPoint: Map<string, boolean> = new Map(); // 已检测过是否包含的点及其结果

    constructor(public id: string | number, public isStatic: boolean = false) {
        this.id = createId(id);
    }

    get needUpdate() {
        return this._needUpdate;
    }

    set needUpdate(needUpdate: boolean) {
        this._needUpdate = needUpdate;
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

        this.events.dispose();
        this.style.dispose();
        if(this._animation) {
            this._animation.el.delete(this);
        }

        this._cached
        = this._animation
        = this.layer
        = this.parent
        = null;
    }

    async draw(ctx: CanvasRenderingContext2D){
        this.beforeUpdate();
        await this.getBoundingRect();
        this.afterUpdate();

        if(this._isPaint()) {
            this.beforeBuild();

            if(!this.isStatic){
                this._cached = null;
            }
            this._cached = this._cached || await this.buildCached();
            this.setTransform(ctx);
            this.style.setAlpha(ctx);
            ctx.drawImage(this._cached, 0, 0, this._cached.width, this._cached.height);

            if(!this.isStatic){
                this._cached = null;
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);

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
        if(this._needUpdate) {
            await this.update();

            this.rect = new BoundingRect(0, 0, this.width, this.height)
                            .transform(this.transform);

            this._needUpdate = false;
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

    /**
     * 触发事件
     * @param type 事件类型
     */
    notifyEvent(type: EventType, event: Event, guiEvent: IGuiEvent) {
        const skip = this.events.notify(type, event, guiEvent, this);

        if(!['change', 'input', 'foucs', 'blur'].includes(type) && !skip && this.parent) {
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

        if(!(this.isStatic && this._cached)){
            if(!this._hadCalc) {
                await this.calcSize();
            }

            this.style.border = Math.min(this.style.border, this.width / 2, this.height / 2);
            if(this.style.border < 0){
                this.style.border = 0;
            }

            this.origin[0] = this.style.origin[0] * this.width;
            this.origin[1] = this.style.origin[1] * this.height;
        }

        this.updateTransform();

        this._checkedPoint.clear();
    }

    afterUpdate(){
        this._dirty = false;
    }

    beforeBuild() {}

    async build(ctx: CanvasRenderingContext2D) {
        const border = this.style.border;
        let width = this.width - border;
        let height = this.height - border;

        buildPath(ctx, 0, 0, width, height, this.style.borderRadius);
        await this.style.build(ctx, width, height);

        if(this.style.background){
            ctx.fill();
        }

        if(border && this.style.borderColor){
            ctx.stroke();
        }
    }

    afterBuild() {
        this._ignore = this._hadCalc = false;
    }

    /**
     * 计算节点宽高
     */
    async calcSize(){
        this.width = parseSize(this.style.width, this._parentWidth);
        this.height = parseSize(this.style.height, this._parentHeight);

        this._hadCalc = true;
    }

    // 更新变换矩阵
    updateTransform(){
        const style = this.style;

        let x: number = this.left, y: number = this.top;
        if(x == null) {
            if(style.left != null) {
                x = parseSize(style.left, this._parentWidth);
            } else if(style.right != null){
                x = this._parentWidth - parseSize(style.right, this._parentWidth) - this.width;
            } else { // x方向没有任何设置, 默认居中
                x = parseSize('50%', this._parentWidth) - this.width / 2;
            }
        }

        if(y == null) {
            if(style.top != null) {
                y = parseSize(style.top, this._parentHeight);
            } else if(style.bottom != null){
                y = this._parentHeight - parseSize(style.bottom, this._parentHeight) - this.height;
            } else {// y方向没有任何设置, 默认居中
                y = parseSize('50%', this._parentHeight) - this.height / 2;
            }
        }

        this.transform
            .toUnit()
            .translate(-this.origin[0], -this.origin[1]) // 变换中心
            .scale(style.scale) // 缩放
            .rotate(style.rotation) // 旋转
            .translate(x + this.origin[0], y + this.origin[1]); // 平移

        // 父节点变换
        if(this.parent){
            const parent = this.parent;
            this.transform
                .translate(parent.style.border, parent.style.border)
                .transform(parent.transform);
        }
    }
    // =============================================================

    /**
     * 缓存绘制
     */
    async buildCached(
        width: number = this.width,
        height: number = this.height,
        start: Vector2 = new Vector2()
    ) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const cachedCtx = canvas.getContext('2d');
        cachedCtx.translate(this.style.border / 2 + start.x, this.style.border / 2 + start.y);
        await this.build(cachedCtx);

        return canvas;
    }

    /**
     * 获取鼠标在哪个元素上
     */
    getTarget(ctx: CanvasRenderingContext2D, x: number, y: number){
        if(this._contain(ctx, x, y)){
            return <Canvas2DElement>this;
        }

        return false;
    }

    /**
     * 设置画布变换
     */
    setTransform(ctx: CanvasRenderingContext2D){
        const transform = new Matrix().copy(this.transform);
        if(this.parent) {
            transform.transform(this.parent.transform.invert());
        }

        const {a, b, c, d, e, f} = transform;
        ctx.transform(a, b, c, d, e, f);
    }

    /**
     * 获取父级尺寸
     */
    getParentSize(key: 'width' | 'height') {
        if(key === 'width') {
            return this._parentWidth;
        } else if(key === 'height') {
            return this._parentHeight;
        }

        return 0;
    }

    /**
     * 检测一个点是否落在此节点上
     */
    protected _contain(ctx: CanvasRenderingContext2D, x: number, y: number){
        if(this._ignore) {
            return false;
        }

        const pk: string = `${x}_${y}`;
        if(this._checkedPoint.has(pk)) {
            return this._checkedPoint.get(pk);
        }

        if(this.rect && !this.rect.contain(x, y)) {
            this._checkedPoint.set(pk, false);
            return false;
        }

        // =======================================处于裁切路径外的点不在此节点上
        const clipParent = this.getParent((parent: Container) => parent.style.clip);
        if(clipParent) {
            const border = clipParent.style.border;

            ctx.setTransform(clipParent.transform);
            ctx.translate(border, border);
            buildPath(
                ctx, 0, 0,
                clipParent.width - border * 2,
                clipParent.height - border * 2,
                clipParent.style.borderRadius
            );

            if(!ctx.isPointInPath(x, y)) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                this._checkedPoint.set(pk, false);

                return false;
            }
        }

        ctx.setTransform(this.transform);
        this.buildPath(ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const result = ctx.isPointInPath(x, y);
        this._checkedPoint.set(pk, result);

        return result;
    }

    protected buildPath(ctx: CanvasRenderingContext2D) {
        buildPath(ctx, 0, 0, this.width, this.height, this.style.borderRadius);
    }

    // 是否需要绘制
    protected _isPaint(){
        if(
            this.isVisible
            && this.style.opacity
            && this.style.scale[0]
            && this.style.scale[1]
            && this.width >= 0
            && this.height >= 0
        ) {
            const clipParent = this.getParent((parent: Container) => parent.style.clip);
            if(clipParent){
                return this.rect.intersect(clipParent.rect);
            }

            if((this.isStatic || this.getParent((parent: Container) => parent.isStatic)) && !this._cached) {
                return true;
            }

            const parent = this.layer ? this : this.getParent((p: Container) => p.layer);

            return this.rect.intersect(0, 0, parent.getParentSize('width'),  parent.getParentSize('height'));
        }

        return false;
    }

    // 计算父节点尺寸
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

        return Math.max(0, base);
    }

    private getParent(filter: Function) {
        let parent = this.parent;
        while(parent){
            if(filter(parent)){
                return parent;
            }

            parent = parent.parent;
        }
    }
}