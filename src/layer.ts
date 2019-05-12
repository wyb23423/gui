/**
 * canvas层
 */
import { Canvas2DElement } from "./node/element";
import { createCanvas } from "./core/dom";
import { findIndexByBinary } from "./tool/util";
import { devicePixelRatio } from './config';
export class Layer {
    canvas?: HTMLCanvasElement;
    dirty: boolean = true; // 是否需要绘制

    private roots: Canvas2DElement[] = [];
    private ctx?: CanvasRenderingContext2D;
    private _time: number = 0; // 最近一次绘制开始时间

    private _drawCanvas?: HTMLCanvasElement;
    private _view?:CanvasRenderingContext2D;

    constructor(width: number, height: number, public z: number = 0) {
        this.canvas = createCanvas(width, height, 'layer' + z);
        this._drawCanvas = createCanvas(width, height, 'layer_draw_' + z)
        this.ctx = this._drawCanvas.getContext('2d');
        this._view = this.canvas.getContext('2d');
    }

    add(el: Canvas2DElement){
        const parent = el.parent || el.layer;
        if(parent !== this){
            if(parent) {
                parent.remove(el, false);
            }

            el.layer = this;
            el.needUpdate = true;
            el.left = el.top = null;

            const index = findIndexByBinary(
                mid => el.style.zIndex - this.roots[mid].style.zIndex || 1,
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
            this.roots.splice(i, 1);

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

        dom.removeChild(this.canvas);
        this.canvas = this.ctx = this._drawCanvas = null;
    }

    beforeRender() {}
    render(){
        this.beforeRender();
        if(this.dirty){
            this.dirty = false;

            this._time = Date.now();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._render(0);
        }
    }
    afterRender() {
        this._view.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._view.drawImage(this._drawCanvas, 0, 0);
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

    resize(width: number, height: number) {
        this.dirty = true;

        this._resize(width, height, this.canvas);
        this._resize(width, height, this._drawCanvas);

        this.roots.forEach(v => v.needUpdate = true);
    }

    private _resize(width: number, height: number, canvas: HTMLCanvasElement) {
        Object.assign(canvas.style, {
            width: `${width}px`,
            height: `${height}px`
        })

        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
    }

    private async _render(i: number){
        const node = this.roots[i++];

        if(node){
            // if(Date.now() - this._time > 15){
            //     this.afterRender();
            //     this.dirty = true;
            // } else {
                await node.draw(this.ctx);
                this._render(i);
            // }
        } else {
            this.afterRender();
        }
    }
}