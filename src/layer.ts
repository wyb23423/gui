/**
 * canvas层
 */
import { Canvas2DElement } from "./node/element";
import { createCanvas } from "./core/dom";

export class Layer {
    canvas?: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;;
    dirty: boolean = true;

    roots: Canvas2DElement[] = [];

    constructor(width: number, height: number, public z: number = 0) {
        this.canvas = createCanvas(width, height, 'layer' + z);
        this.ctx = this.canvas.getContext('2d');
    }

    add(el: Canvas2DElement){
        if(el.layer !== this){
            if(el.layer) {
                el.layer.remove(el, false).dirty = true;
            }

            el.layer = this;
            this.roots.push(el);

            this.dirty = true;
        }

        return this;
    }

    remove(el: Canvas2DElement, dispose: boolean = true){
        const i: number = this.roots.findIndex(v => v === el);
        if(i >= 0) {
            el.layer = null;
            this.roots.splice(i, 0);

            if(dispose) {
                el.dispose();
            }

            this.dirty = true;
        }

        return this;
    }

    dispose(){
        this.roots.forEach(v => {
            v.layer = null;
            v.dispose();
        });
        
        this.roots.length = 0;
        this.canvas = this.ctx = null;
    }

    render(){
        if(this.dirty){
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.roots.forEach(v => v.draw(this.ctx));
            this.dirty = false;
        }
    }
}