/**
 * 容器元素基类
 */

import { Canvas2DElement } from "./element";
import { Istyle } from "../core/style";
import { Matrix } from "../lib/matrix";
import { findIndexByBinary } from "../tool/util";

export class Container extends Canvas2DElement {
    readonly type: string = 'container';

    children: Canvas2DElement[] = [];

    set isStatic(isStatic: boolean){
        this._isStatic = isStatic;
        this.children.forEach(v => v.isStatic = isStatic);
    }

    attr(key: string | Istyle, value?: any){
        if(typeof key === 'string') {
            key = {[key]: value};
        }

        // 带边框的父元素的裁剪会影响子元素的鼠标拾取范围, 这里对其进行了简单处理
        // 只要clip或border可能会改变时就清除所有子元素的拾取缓存
        if(Reflect.has(key, 'clip') || Reflect.has(key, 'border')) {
            this.children.forEach(v => v.checkedPoint.clear());
        }

        super.attr(key, value);

        if(!this.rect){
            this.children.forEach(v => v.rect = null);
        }

        return this;
    }

    async build(ctx: CanvasRenderingContext2D){
        await super.build(ctx);

        ctx.restore();

        ctx.save();
        this.style.inherit(ctx);

        return this._renderChildren(ctx);
    }

    remove(el: Canvas2DElement, dispose: boolean = true){
        const i = this.children.findIndex(v => v === el);
        if(i >= 0){
            el.parent = el.rect = null;
            this.children.splice(i, 1);

            if(dispose) {
                el.dispose();
            }

            this.markDirty();
        }

        return this;
    }

    add(el: Canvas2DElement){
        const parent = el.parent || el.layer;

        if(parent !== this) {
            if(parent){
                parent.remove(el, false);
            }
            el.parent = this;

            const index = findIndexByBinary(
                mid => el.style.zIndex - this.children[mid].style.zIndex,
                this.children.length
            );
            this.children.splice(index, 0, el);
            this.markDirty();
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

    async buildCached(width: number, height: number, ctx: CanvasRenderingContext2D){
        this.children.forEach(v => v.isStatic = false);

        this._cachedTransform = new Matrix();

        return super.buildCached(ctx.canvas.width, ctx.canvas.height, ctx);
    }

    getTarget(ctx: CanvasRenderingContext2D, x: number, y: number): false | Canvas2DElement {
        if(this._contain(ctx, x, y)){
            for(let i=this.children.length - 1; i>=0; i--){
                const traget = this.children[i].getTarget(ctx, x, y);

                if(traget) {
                    return traget;
                }
            }

            return <Canvas2DElement>this;
        }

        return false;
    }

    private _renderChildren(ctx: CanvasRenderingContext2D): Promise<void> {
        return new Promise(resolve => {
            const _render = async (i: number) => {
                const node = this.children[i++];
                if(node){
                    await node.draw(ctx);
                    _render(i);
                } else {
                    resolve();
                }
            }

            _render(0);
        });
    }
}