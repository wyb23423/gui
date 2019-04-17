/**
 * canvas层
 */

/// <reference path="./types.d.ts" />

export class Layer implements ILayer {
    canvas: HTMLCanvasElement = document.createElement('canvas');
    ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
    dirty: boolean = true;

    roots: ICanvas2DElement[] = [];

    constructor(public z: number = 0) {}

    add(el: ICanvas2DElement){
        if(el.layer !== this){
            el.layer = this;
            this.roots.push(el);
        }

        return this;
    }

    remove(el: ICanvas2DElement){
        const i: number = this.roots.findIndex(v => v === el);
        if(i >= 0) {
            el.layer = null;
            this.roots.splice(i, 0)[0].dispose();
        }

        return this;
    }

    dispose(){
        this.roots.forEach(v => {
            v.layer = null;
            v.dispose();
        })
        
        this.roots.length = 0;
        this.canvas = this.ctx = null;
    }
}