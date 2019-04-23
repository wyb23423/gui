/**
 * canvas层
 */
import { Canvas2DElement } from "./node/element";
import { createCanvas } from "./core/dom";
import { findIndexByBinary } from "./tool/util";

export class Layer {
    canvas?: HTMLCanvasElement;
    dirty: boolean = true; // 是否需要绘制

    private roots: Canvas2DElement[] = [];
    private ctx?: CanvasRenderingContext2D;
    private _time: number = 0; // 最近一次绘制开始时间

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
            const index = findIndexByBinary(
                mid => el.style.zIndex - this.roots[mid].style.zIndex,
                this.roots.length
            );
            this.roots.splice(index, 0, el);

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

    dispose(dom: HTMLElement){
        this.roots.forEach(v => {
            v.layer = null;
            v.dispose();
        });
        this.roots.length = 0;

        if(dom) {
            dom.removeChild(this.canvas);
        }
        this.canvas = this.ctx = null;
    }

    render(){
        if(this.dirty){
            this.dirty = false;

            this._time = Date.now();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._render(0);
        }
    }

    getTarget(x: number, y: number){
        for(let i=this.roots.length - 1; i>=0; i--){
            const traget = this.roots[i].getTarget(this.ctx, x, y);

            if(traget) {
                return traget;
            }
        }

        return false;
    }

    private async _render(i: number){
        const node = this.roots[i++];

        if(node){
            if(Date.now() - this._time > 15){
                this.dirty = true;
            } else {
                await node.draw(this.ctx);
                this._render(i);
            }
        }
    }
}