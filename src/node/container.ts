/**
 * 容器元素基类
 */

import { Canvas2DElement } from "./element";
import { Istyle } from "../core/style";

export class Container extends Canvas2DElement {
    children: Canvas2DElement[] = [];

    attr(key: string | Istyle, value?: any){
        super.attr(key, value);

        if(!this.rect){
            this.children.forEach(v => v.rect = null);
        }
    }

    async build(ctx: CanvasRenderingContext2D){
        const width = this.width - this.style.border;
        const height = this.height - this.style.border;

        ctx.beginPath();
        if(this.style.borderRadius){
            this.buildPath(ctx);
        } else {
            ctx.rect(0, 0, width, height);
        }
        ctx.closePath();

        await this.style.build(ctx, width, height);

        if(this.style.background){
            ctx.fill();
        }
        if(this.style.border){
            ctx.stroke();
        }

        ctx.restore();

        ctx.save();
        this.setTransform(ctx);
        this.style.inherit(ctx, width, height);

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