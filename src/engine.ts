import { Layer } from "./layer";
import { addHandler, getPosition, removeHandler } from "./core/dom";
import { IGuiEvent, EventType } from "./core/event";
import { Canvas2DElement } from "./node/element";
import { devicePixelRatio } from './config';

// =============================================
const eventNames: EventType[] = [
    'dbclick', 'click', 'mousedown', 'mouseup', 'mousemove',
    'touchstart', 'touchmove', 'touchend'
];
// ===============================================
export class Engine {
    private _layers: Map<number, Layer> = new Map();
    private _timer?: number;
    private _preTarget?: Canvas2DElement;
    private _isOut: boolean = false;

    constructor(private _root: HTMLElement) {
        Object.assign(_root.style, {
            '-webkit-tap-highlight-color': 'transparent',
            '-webkit-user-select': 'none',
            'user-select': 'none',
            '-webkit-touch-callout': 'none',
            'touch-action': 'none'
        })
        _root.innerHTML = '';
        if(!['relative', 'absolute', 'fixed'].includes(_root.style.position)){
            _root.style.position = 'relative';
        }

        eventNames.forEach((type : EventType) => {
            addHandler(this._root, type, this._eventHandler);
        })
        addHandler(_root, 'mouseleave', this._leave);
        addHandler(_root, 'mouseenter', this._enter);
    }

    get width() {
        return this._root ? this._root.offsetWidth : 0;
    }

    get height() {
        return this._root ? this._root.offsetHeight : 0;
    }

    getLayer(z: number){
        return this._layers.get(z);
    }

    render(){
        this._layers.forEach(v => v.render());

        if(this._root){
            this._timer = requestAnimationFrame(this.render.bind(this));
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
        if(this._timer) {
            cancelAnimationFrame(this._timer);
        }
        this._layers.forEach(this.removeLayer, this);

        if(this._root) {
            eventNames.forEach((type : EventType) => {
                removeHandler(this._root, type, this._eventHandler);
            })
            removeHandler(this._root, 'mouseleave', this._leave);
            removeHandler(this._root, 'mouseenter', this._enter);
        }
        this._root = this._preTarget = null;
    }

    resize() {
        this._layers.forEach(v => v.resize(this._root.offsetWidth, this._root.offsetHeight));
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

    private _getTarget(x: number, y: number) {
        const layers = Array.from(this._layers.keys()).sort((a, b) => b - a);
        for(const layer of layers) {
            const target = this._layers.get(layer).getTarget(x, y);

            if(target) {
                return target;
            }
        }
    }

    private _eventHandler = (e: Event) =>{
        if(!this._isOut) {
            e = e || window.event;
            let {x, y} = getPosition(this._root, <MouseEvent>e);
            x *= devicePixelRatio;
            y *= devicePixelRatio;
            const target = this._getTarget(x, y);
            const guiEvent:IGuiEvent = {x, y, target, cancelBubble: false};
            if(e.type === 'mousemove' || e.type === 'touchmove') {
                this._moveHandler(guiEvent, e, e.type);
            }

            if(target && e.type !== 'mousemove' && e.type !== 'touchmove') {
                target.notifyEvent(<EventType>e.type, e, guiEvent);
            }
        }
    }
    private _moveHandler(guiEvent: IGuiEvent, e: Event, type: 'mousemove' | 'touchmove') {
        if(this._preTarget === guiEvent.target) {
            guiEvent.target && guiEvent.target.notifyEvent(type, e, guiEvent);
        } else {
            if(this._preTarget) {
                this._preTarget.notifyEvent('mouseout', e, {...guiEvent, relatedTarget: guiEvent.target});
            }
            if(guiEvent.target) {
                guiEvent.target.notifyEvent('mouseover', e, {...guiEvent, relatedTarget: this._preTarget});
            }
        }

        this._preTarget = guiEvent.target;
    };
    private _leave = () => this._isOut = true;
    private _enter = () => this._isOut = false;
}