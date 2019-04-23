import { Layer } from "./layer";

export class Engine {
    private _layers: Map<number, Layer> = new Map();

    constructor(private _root: HTMLElement) {
        Object.assign(_root.style, {
            '-webkit-tap-highlight-color': 'transparent',
            '-webkit-user-select': 'none',
            'user-select': 'none',
            '-webkit-touch-callout': 'none'
        })
        _root.innerHTML = '';
        if(!['relative', 'absolute', 'fixed'].includes(_root.style.position)){
            _root.style.position = 'relative';
        }
    }

    getLayer(z: number){
        return this._layers.get(z);
    }

    render(){
        this._layers.forEach(v => v.render());

        if(this._root){
            requestAnimationFrame(this.render.bind(this));
        }
    }

    addLayer(layer: Layer | number){
        let z: number = typeof layer === 'number' ? layer : layer.z;
        if(this._layers.has(z)) {
            console.warn(`层级${z}已存在`);
        } else {
            if(typeof layer === 'number'){
                layer = new Layer(this._root.offsetWidth, this._root.offsetHeight, layer);
            }

            this._addLayerToDom(layer)._layers.set(z, layer);
        }

        return this;
    }

    replaceLayer(layer: Layer){
        const old = this._layers.get(layer.z);
        if(old){
            old.dispose(this._root);
        }
        this._addLayerToDom(layer)._layers.set(layer.z, layer);

        return this;
    }

    removeLayer(layer: Layer | number){
        const z: number = typeof layer === 'number' ? layer : layer.z;
        const curLayer = this._layers.get(z);
        if(curLayer){
            curLayer.dispose(this._root);
            this._layers.delete(z);
        }

        return this;
    }

    dispose(){
        this._layers.forEach(this.removeLayer, this);

        this._root = null;
    }

    private _addLayerToDom(layer: Layer){
        for(const v of Array.from(this._layers.values())){
            if(v.z > layer.z){
                this._root.insertBefore(layer.canvas, v.canvas);

                return this;
            }
        }

        this._root.appendChild(layer.canvas);

        return this;
    }
}