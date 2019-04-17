/**
 * 行为类似于dom的div的元素
 */
/// <reference path="../types.d.ts" />

import { Canvas2DElement } from "./element";
import { BoundingRect } from "../core/bounding_rect";
import { parseNumArr } from "../core/style";

export class Div extends Canvas2DElement {
    style: IStyle = {};
    children: Canvas2DElement[] = [];

    private _rect?: BoundingRect;

    build(ctx: CanvasRenderingContext2D){
        this.getBoundingRect();

        if(this.style.borderRadius){
            this.buildPath(ctx);
        } else {
            ctx.rect(this._rect.x, this._rect.y, this._rect.w, this._rect.h);
        }

        if(this.style.borderColor){
            ctx.strokeStyle = this.style.borderColor;
        }
        if(this.style.border){
            ctx.lineWidth = this.style.border;
            ctx.stroke();
        }
        
        if(this.style.background){
            ctx.fillStyle = this.style.background;
            ctx.fill();
        }
    }

    private buildPath(ctx: CanvasRenderingContext2D){
        ctx.beginPath();

        const {x, y, w, h} = this._rect;
        const radius = parseNumArr(this.style.borderRadius);

        ctx.moveTo(x, y + h - radius[3]);

        ctx.arcTo(x, y, x + w, y, radius[0]);
        ctx.arcTo(x + w, y, x + w, y + h, radius[1]);
        ctx.arcTo(x + w, y + h, x, y + h, radius[2]);
        ctx.arcTo(x, y + h, x, y, radius[3]);

        ctx.closePath();
    }

    private getBoundingRect(){
        if(this._rect) return;

        let x: number, y: number, w: number, h: number;

        x = this.transform.e;
        y = this.transform.f;
        
    }
}