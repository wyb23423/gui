/**
 * 节点基类
 */
/// <reference path="../types.d.ts" />

import { Matrix } from "../lib/matrix";
import { Layer } from "../layer";

export class Canvas2DElement implements ICanvas2DElement {
    type = <'div'>'div';
    dirty = true;
    transform = new Matrix();
    parent?: ICanvas2DElement;
    style: IStyle = {};
    layer?: Layer;

    private _cached?: HTMLCanvasElement;

    constructor(
        public id: string | number,
        public isStatic: boolean = false
    ) {}

    addSelfToLayer(layer: Layer){
        if(layer){
            layer.add(this);
        }

        return this;
    }

    dispose() {
        if(this.layer) {
            this.layer.remove(this);
        }

        if(this.parent && this.parent.removeChild){
            this.parent.removeChild(this);
        }

        this._cached
        = this.layer
        = this.parent = null;
    }

    draw(ctx: CanvasRenderingContext2D){
        ctx.save();
        ctx.setTransform(this.transform);
        if(this.isStatic){
            if(!this._cached){
                this._cached = document.createElement('canvas');
                this.build(this._cached.getContext('2d'));
            }
            ctx.drawImage(this._cached, 0, 0);
        } else {
            this.build(ctx);
        }
        ctx.restore();
    }

    protected updateTransform(){
        let parent: ICanvas2DElement = this.parent;
        while(parent){
            this.transform.transform(<Matrix>parent.transform);
            parent = parent.parent;
        }

        return this;
    }

    private build(ctx: CanvasRenderingContext2D) {}
}