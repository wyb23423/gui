import { Layer } from "./layer";

export class Engine {
    layers: Map<number, Layer> = new Map();

    constructor(private _root: HTMLElement) {
        Object.assign(_root.style, {
            '-webkit-tap-highlight-color': 'transparent',
            '-webkit-user-select': 'none',
            'user-select': 'none',
            '-webkit-touch-callout': 'none'    
        })
        _root.innerHTML = '';
    }

    render(){
        this.layers.forEach(v => v.render());
        
        if(this._root){
            requestAnimationFrame(this.render.bind(this));
        }
    }

    addLayer(layer: Layer | number){
        let z: number = typeof layer === 'number' ? layer : layer.z;
        if(this.layers.has(z)) {
            console.warn(`层级${z}已存在`);
        } else {
            if(typeof layer === 'number'){
                layer = new Layer(this._root.offsetWidth, this._root.offsetHeight, layer);
            }

            this.layers.set(z, layer);
        }

        return this;
    }

    replaceLayer(layer: Layer){
        const old = this.layers.get(layer.z);
        if(old){
            this._root.removeChild(old.canvas);
            old.dispose();
        }
        this.layers.set(layer.z, layer);

        return this;
    }

    removeLayer(layer: Layer | number){
        const z: number = typeof layer === 'number' ? layer : layer.z;
        const curLayer = this.layers.get(z);
        if(curLayer){
            this._root.removeChild(curLayer.canvas);
            curLayer.dispose();
            this.layers.delete(z);
        }
        
        return this;
    }

    dispose(){
        this.layers.forEach(v => v.dispose());
        this.layers.clear();

        this._root = null;
    }
}