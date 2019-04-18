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
        ctx.beginPath();
        if(this.style.borderRadius){
            this.buildPath(ctx);
        } else {
            ctx.rect(0, 0, this.rect.w, this.rect.h);
        }
        ctx.closePath();

        await this.style.build(ctx);

        if(this.style.border){
            ctx.stroke();
        }
        if(this.style.background){
            ctx.fill();
        }

        return Promise.all(
            Array.from(this.children)
                .sort((a, b) => a.style.zIndex - b.style.zIndex)
                .map(v => v.draw(ctx))
        );
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

    private buildPath(ctx: CanvasRenderingContext2D){
        const {w, h} = this.rect;
        const radius = this.style.borderRadius;

        ctx.moveTo(0, h - radius[3]);

        ctx.arcTo(0, 0, w, 0, radius[0]);
        ctx.arcTo(w, 0, w, h, radius[1]);
        ctx.arcTo(w, h, 0, h, radius[2]);
        ctx.arcTo(0, h, 0, 0, radius[3]);
    }
}