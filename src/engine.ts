import { Layer } from "./layer";

export class Engine {
    layers: Map<number, Layer> = new Map();

    constructor(private _root?: HTMLElement) {}

    render(){
        this._render();
        
        if(this._root){
            requestAnimationFrame(this.render.bind(this));
        }
    }

    addLayer(layer: Layer | number){
        if(typeof layer === 'number'){
            layer = new Layer(layer);
        }

        if(this.layers.has(layer.z)){
            console.warn(`层级${layer.z}已存在`);
        } else {
            this.layers.set(layer.z, layer);
        }

        return this;
    }

    replaceLayer(layer: Layer){
        const old = this.layers.get(layer.z);
        if(old){
            old.dispose();
        }
        this.layers.set(layer.z, layer);

        return this;
    }

    removeLayer(layer: Layer | number){
        const z: number = typeof layer === 'number' ? layer : layer.z;
        if(this.layers.has(z)){
            this.layers.get(z).dispose();
            this.layers.delete(z);
        }
        
        return this;
    }

    dispose(){

    }

    private _render(){
        this.layers.forEach(v=>{
            if(v.dirty){
                //
            }
        });
    }
}