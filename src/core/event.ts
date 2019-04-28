/**
 * 事件
 */
import { Canvas2DElement } from "../node/element";

export interface IGuiEvent {
    x: number;
    y: number;
    target: Canvas2DElement;
    relatedTarget?: Canvas2DElement;
    cancelBubble: boolean;
}

export class EventFul {
    private _handlers: {[type: string]: Set<Function>} = {};

    on(type: string, fn: Function) {
        (this._handlers[type] || (this._handlers[type] = new Set())).add(fn);

        return this;
    }

    off(type: string, fn: Function) {
        const handlers = this._handlers[type];
        if(handlers) {
            handlers.delete(fn);
        }

        return this;
    }

    notify(type: string, event: Event, guiEvent: IGuiEvent, context: Canvas2DElement) {
        const handlers = this._handlers[type];
        if(handlers) {
            handlers.forEach(fn => fn.call(context, guiEvent, event));
        }

        return guiEvent.cancelBubble;
    }

    dispose() {
        this._handlers = {};
    }
}