/**
 * 节点基类
 */

import { Matrix } from "../lib/matrix";
import { Layer } from "../layer";
import { Container } from "./container";
import { BoundingRect } from "../core/bounding_rect";
import { Style, Istyle } from "../core/style";

export class Canvas2DElement {
    transform = new Matrix();
    parent?: Container;
    layer?: Layer;
    rect?: BoundingRect;

    style: Style = new Style();

    private isVisible?: boolean = true;
    private _cached?: HTMLCanvasElement;  

    constructor(
        public id: string | number,
        public isStatic: boolean = false
    ) {}

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
        if(this.isVisible) {
            this.getBoundingRect();

            ctx.save();
            ctx.setTransform(this.transform);
            if(this.isStatic){
                if(!this._cached){
                    this._cached = this.rect.createCanvas();
                    await this.build(this._cached.getContext('2d'));
                }
                ctx.drawImage(this._cached, 0, 0);
            } else {
                this.build(ctx);
            }
            ctx.restore();
        }
    }

    attr(key: string | Istyle, value: any){
        if(this.style.set(key, value)){
            this.rect = null;
        }

        this.markDirty();
    }
    
    build(ctx: CanvasRenderingContext2D) {}

    getBoundingRect() {
        if(!this.rect) {
            const width = this._parseSize(this.style.width, 'width');
            const height = this._parseSize(this.style.height, 'height');
    
            this._updateTransform(width, height);
            this.rect = new BoundingRect(this.transform.e, this.transform.f, width, height);
        }

        return this.rect;
    };

    markDirty(){
        if(this.parent){
            this.parent.markDirty();
        }
        if(this.layer){
            this.layer.dirty = true;
        }
    }

    private _updateTransform(width: number, height: number){
        const style = this.style;

        let x: number, y: number;
        if(style.left != null) {
            x = this._parseSize(style.left, 'width');
        } else if(style.right != null){
            x = this._parseSize(style.right, 'width');
        } else {
            x = this._parseSize('50%', 'width') - width / 2;
        }

        if(style.top != null) {
            y = this._parseSize(style.top, 'height');
        } else if(style.bottom != null){
            y = this._parseSize(style.bottom, 'height');
        } else {
            y = this._parseSize('50%', 'height') - height / 2;
        }

        this.transform.e = x;
        this.transform.f = y;

        this.transform
            .rotate(this.style.rotation)
            .scale(this.style.scale[0], this.style.scale[1]);

        if(this.parent){
            this.transform.transform(this.parent.transform);
        }
    }

    private _parseSize(size: number | string, key: 'width'| 'height'): number {
        if(typeof size === 'string'){
            if(size.endsWith('%')){
                let base: number = 0;
                if(this.parent) {
                    base = this.parent.rect[key[0]];
                } else if(this.layer){
                    base = this.layer.canvas[key];
                }

                return base * (parseFloat(size) || 0);
            } else {
                return parseFloat(size) || 0;
            }
        }

        return <number>size;
    }
}