import { Layer } from "./layer";

export class Engine {
    layers: Map<number, Layer> = new Map();

    _root?: HTMLElement;

    render(){
        this._render();
        
        if(this._root){
            requestAnimationFrame(this.render.bind(this));
        }
    }

    private _render(){
        this.layers.forEach(v=>{
            if(v.dirty){
                //
            }
        });
    }
}