/**
 * 容器元素基类
 */

import { Canvas2DElement } from "./element";
import { Istyle } from "../core/style";
import { findIndexByBinary } from "../tool/util";
import { buildPath } from "../tool/paint";
import { Vector2 } from "../lib/vector";
import { BoundingRect } from "../core/bounding_rect";

export class Container extends Canvas2DElement {
    readonly type: string = 'container';

    children: Canvas2DElement[] = [];

    private _start = new Vector2();

    get needUpdate() {
        return this._needUpdate;
    }

    set needUpdate(needUpdate: boolean) {
        if(needUpdate !== this._needUpdate) {
            this._needUpdate = needUpdate;
            if(needUpdate && !(this.isStatic && this._cached)) {
                this.children.forEach(v => v.needUpdate = true);
            }
        }
    }

    attr(key: string | Istyle, value?: any){
        if(typeof key === 'string') {
            key = {[key]: value};
        }

        // 带边框的父元素的裁剪会影响子元素的鼠标拾取范围, 这里对其进行了简单处理
        // 只要clip或border可能会改变时就清除所有子元素的拾取缓存
        if(Reflect.has(key, 'clip') || Reflect.has(key, 'border')) {
            this.children.forEach(v => v.needUpdate = true);
        }

        super.attr(key, value);

        return this;
    }

    async build(ctx: CanvasRenderingContext2D){
        await super.build(ctx);

        if(this.style.clip){
            buildPath(
                ctx,
                this.style.border / 2,
                this.style.border / 2,
                this.width - this.style.border * 2,
                this.height - this.style.border * 2,
                this.style.borderRadius
            );
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if(this.style.clip){
            ctx.save();
            ctx.clip();
        }

        return this._renderChildren(ctx);
    }

    remove(el: Canvas2DElement, dispose: boolean = true){
        if(el) {
            const i = this.children.findIndex(v => v === el);
            if(i >= 0){
                el.parent = null;
                this.children.splice(i, 1);

                if(dispose) {
                    el.dispose();
                }

                this.markDirty();
            }
        }

        return this;
    }

    add(el: Canvas2DElement){
        if(el) {
            const parent = el.parent || el.layer;

            if(parent !== this) {
                if(parent){
                    parent.remove(el, false);
                }
                el.parent = this;
                el.left = el.top = null;
                el.needUpdate = true;

                el.index = this.children.length;
                const index = findIndexByBinary(
                    mid => el.style.zIndex - this.children[mid].style.zIndex || 1,
                    this.children.length
                );
                this.children.splice(index, 0, el);
                this.markDirty();
            }
        }

        return this;
    }

    dispose(){
        super.dispose();

        this.children.forEach(v => {
            v.parent = null;
            v.dispose();
        });
        this.children.length = 0;
    }

    setTransform(ctx: CanvasRenderingContext2D){
        super.setTransform(ctx);
        ctx.translate(-this._start.x, -this._start.y);
    }

    async buildCached(){
        const invert = this.transform.invert();
        let maxRect = (await this._getMaxRect()).transform(invert);
        if(this.style.clip) {
            maxRect = new BoundingRect(0, 0, this.width, this.height);
        }

        this._start.x = -maxRect.x;
        this._start.y = -maxRect.y;

        return super.buildCached(maxRect.w, maxRect.h, this._start);
    }

    getTarget(ctx: CanvasRenderingContext2D, x: number, y: number): false | Canvas2DElement {
        for(let i=this.children.length - 1; i>=0; i--){
            const traget = this.children[i].getTarget(ctx, x, y);

            if(traget) {
                return traget;
            }
        }

        return this._contain(ctx, x, y) ? this : false;
    }

    protected _renderChildren(ctx: CanvasRenderingContext2D): Promise<void> {
        return new Promise(resolve => {
            const _render = async (i: number) => {
                const node = this.children[i++];
                if(node){
                    ctx.translate(this._start.x, this._start.y);
                    await node.draw(ctx);
                    _render(i);
                } else {
                    if(this.style.clip){
                        ctx.restore();
                    }
                    resolve();
                }
            }

            _render(0);
        });
    }

    async update() {
        await super.update();

        if(this.needUpdate) {
            let isStaic = this.isStatic;
            let el:Container = this;
            if(!isStaic) {
                el = this.getParent((parent: Container) => parent);
                isStaic = !!el;
            }

            if(isStaic && el._cached) {
                this._updateChildren();
            }
        }
    }

    private _updateChildren() {
        this.children.forEach(v => {
            v.beforeUpdate();

            v.needUpdate = true;
            v.getBoundingRect().then(() => {
                v.afterUpdate();

                if(v.isPaint()) {
                    v.beforeBuild();
                    v.afterBuild();
                }
            });
        })
    }

    private async _getMaxRect() {
        const rect = (await this.getBoundingRect()).clone();
        for(const v of this.children) {
            const other =  await (v instanceof Container ?  v._getMaxRect() :  v.getBoundingRect());
            rect.extend(other);
        }

        return rect;
    }
}