/**
 * 单向可滚动容器
 */
import { Container } from "./container";
import { Stack } from "./stack";
import { Canvas2DElement } from "./element";
import { IGuiEvent } from "../core/event";
import { addHandler, removeHandler } from "../core/dom";
import { devicePixelRatio as ratio } from "../config";

export class Scroll extends Container {
    readonly type: string = 'scroll';

    children: Stack[] = [];
    move: number = 0; // 移动距离, [-this.maxMove, 0]
    more: number = 10; // 回弹效果
    maxMove: number = 0;

    private _isVertical: boolean = true; // 是否是垂直排列
    private _isDown: boolean = false;
    private _downPoint: number = 0;

    constructor(id: number | string) {
        super(id);
        super.add(new Stack(`__scroll__${id}`).attr('zIndex', -Number.MAX_VALUE));

        this.events.on('mousedown', this._downCall);
        this.events.on('mousemove', this._moveCall);

        this.events.on('touchstart', this._downCall);
        this.events.on('touchmove', this._moveCall);

        addHandler(document, 'mouseup', this._upCall);
        addHandler(document, 'touchend', this._upCall);
    }

    get isVertical() {
        return this._isVertical;
    }

    set isVertical(isVertical: boolean) {
        if(isVertical !== this._isVertical) {
            this._isVertical = isVertical;
            this.move = 0;
            this.needUpdate = true;
            this.children[0].isVertical = isVertical;
        }
    }

    remove(el: Canvas2DElement, dispose: boolean = true){
        if(!this.children.length) {
            super.add(new Stack(`__scroll__0`).attr('zIndex', -Number.MAX_VALUE));
        }
        this.children[0].remove(el, dispose);

        return this;
    }

    add(el: Canvas2DElement){
        if(!this.children.length) {
            super.add(new Stack(`__scroll__0`).attr('zIndex', -Number.MAX_VALUE));
        }
        this.children[0].add(el);

        return this;
    }

    dispose(){
        super.dispose();

        removeHandler(document, 'mouseup', this._upCall);
        removeHandler(document, 'touchend', this._upCall);
    }

    beforeUpdate() {
        super.beforeUpdate();

        this.style.clip = true;

        this.children.length = 1;
        const stack = this.children[0];
        stack[this._isVertical ? 'top' : 'left'] = this.move;
        stack.isVertical = this._isVertical;
        stack.isStatic = this.isStatic = false;

        this._setBuild(stack);
    }

    getTarget(ctx: CanvasRenderingContext2D, x: number, y: number): false | Canvas2DElement {
        const target = super.getTarget(ctx, x, y);

        return target === this.children[0] ? this : target;
    }

    private _downCall(guiEvent: IGuiEvent) {
        this._isDown = true;
        this._downPoint = this._isVertical ? guiEvent.y : guiEvent.x;
    }

    private _moveCall(guiEvent: IGuiEvent, event: MouseEvent) {
        if(this._isDown) {
            if(event.preventDefault){
                event.preventDefault();
            }else{
                event.returnValue = false;
            }

            const now = this._isVertical ? guiEvent.y : guiEvent.x;
            const diff = (now - this._downPoint) / ratio;
            const sizeKey: 'height' | 'width' = this._isVertical ? 'height' : 'width';
            this.maxMove = this.children[0][sizeKey] - this[sizeKey] + this.style.border * 2;

            if(Math.abs(diff) > 1e-3 && this.maxMove >= 1) {
                this.move += diff;
                this.move = Math.min(this.more, Math.max(this.move, -this.maxMove - this.more));

                this.children[0].needUpdate = true;
                this.markDirty();

                this.notifyEvent('scroll', null, guiEvent);
            }
        }
    }

    private _setBuild(stack: Stack) {
        if(!stack.hasOwnProperty('buildCached')) {
            const sizeKey = this._isVertical ? 'height' : 'width';
            const _this = this;
            stack.buildCached = async function() {
                const invert = this.transform.invert();
                const maxRect = (await this._getMaxRect()).transform(invert);
                if(maxRect[sizeKey[0]] > _this[sizeKey]) {
                    maxRect[this._isVertical ? 'y' : 'x'] = -_this.move;
                    maxRect[sizeKey[0]] = _this[sizeKey];
                }
                this._start.x = -maxRect.x;
                this._start.y = -maxRect.y;

                const buildCached = Canvas2DElement.prototype.buildCached;
                return buildCached.call(this, maxRect.w, maxRect.h, this._start);
            }
        }
    }

    private _upCall = () => {
        this._isDown = false;

        if(this.move > 0 || this.move < -this.maxMove) {
            this.move = Math.min(0, Math.max(this.move, -this.maxMove));
            this.children[0].needUpdate = true;
            this.markDirty();
        }
    }
}