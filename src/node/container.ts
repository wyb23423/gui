/**
 * 容器元素基类
 */

import { Canvas2DElement } from "./element";
import { Istyle } from "../core/style";
import { Matrix } from "../lib/matrix";

export class Container extends Canvas2DElement {
    children: Canvas2DElement[] = [];

    set isStatic(isStatic: boolean){
        this._isStatic = isStatic;
        this.children.forEach(v => v.isStatic = isStatic);
    }

    attr(key: string | Istyle, value?: any){
        super.attr(key, value);

        if(!this.rect){
            this.children.forEach(v => v.rect = null);
        }
    }

    async build(ctx: CanvasRenderingContext2D){
        const border = this.style.border;
        const width = this.width - border;
        const height = this.height - border;

        ctx.beginPath();
        if(this.style.borderRadius){
            this.buildRadiusPath(ctx);
        } else {
            ctx.rect(0, 0, width, height);
        }
        ctx.closePath();

        await this.style.build(ctx, width, height);

        if(border){
            ctx.stroke();

            if(this.style.background){
                ctx.beginPath();
                ctx.rect(border / 2, border / 2, width - border, height - border);
                ctx.closePath();
            }
        }

        if(this.style.background){
            ctx.fill();
        }

        ctx.restore();

        ctx.save();
        this.style.inherit(ctx);

        return this._renderChildren(ctx);
    }

    remove(el: Canvas2DElement, dispose: boolean = true){
        const i = this.children.findIndex(v => v === el);
        if(i >= 0){
            el.parent = null;
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
        if(parent){
            parent.remove(el, false);
        }
        el.rect = null;
        el.parent = this;

        this.children.push(el);
        this.markDirty();

        return this;
    }

    dispose(){
        super.dispose();
        this.children.forEach(v => v.dispose());
        this.children.length = 0;
    }

    async buildCached(width: number, height: number, ctx: CanvasRenderingContext2D){
        this.children.forEach(v => v.isStatic = false);

        this._cachedTransform = new Matrix();

        return super.buildCached(ctx.canvas.width, ctx.canvas.height, ctx);
    }

    private _renderChildren(ctx: CanvasRenderingContext2D){
        const arr = Array.from(this.children).sort((a, b) => a.style.zIndex - b.style.zIndex);

        return new Promise(resolve => {
            const _render = async (i: number) => {
                const node = arr[i++];
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