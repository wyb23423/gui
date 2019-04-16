import { Canvas2DElement } from "./node/element";

export class Layer {
    z: number = 0;
    canvas: HTMLCanvasElement = document.createElement('canvas');
    ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
    nodes: Canvas2DElement[] = [];
    dirty: boolean = false;

    remove(key: Canvas2DElement | string){
        const i = this._findIndex(key);
        if(i >= 0) {
            this.nodes.splice(i, 1);
        }

        return this;
    }

    find(key: Canvas2DElement | string){
        return this.nodes[this._findIndex(key)];
    }

    private _findIndex(key: Canvas2DElement | string){
        return this.nodes.findIndex(v => {
            if(typeof key === 'string'){
                return v.id === key;
            } else {
                return v === key;
            }
        })
    }
}