/**
 * 单向可滚动容器
 */
import { Container } from "./container";
import { Stack } from "./stack";
import { Canvas2DElement } from "./element";
import { IGuiEvent } from "../core/event";
import { addHandler, removeHandler } from "../core/dom";

export class Scroll extends Container {
    readonly type: string = 'scroll';

    children: Stack[] = [];
    move: number = 0; // 移动距离, [-this._maxMove, 0]
    more: number = 10; // 回弹效果

    private _isVertical: boolean = true; // 是否是垂直排列
    private _isDown: boolean = false;
    private _downPoint: number = 0;
    private _maxMove: number = 0;

    constructor(id: number | string, isStatic?: boolean) {
        super(id, isStatic);
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
        this.children[0].remove(el, dispose);

        return this;
    }

    add(el: Canvas2DElement){
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
        this.children[0].style[this._isVertical ? 'top' : 'left'] = this.move;
        this.children[0].isVertical = this._isVertical;
        this.children[0].isStatic = this.isStatic;
        this.isStatic = false;
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
            const diff = now - this._downPoint;

            const sizeKey: 'height' | 'width' = this._isVertical ? 'height' : 'width';
            this._maxMove = this.children[0][sizeKey] - this[sizeKey] + this.style.border * 2;

            if(Math.abs(diff) > 1e-3 && this._maxMove >= 1) {
                this.move += diff;
                this.move = Math.min(this.more, Math.max(this.move, -this._maxMove - this.more));

                this.needUpdate = true;
                this.markDirty();
            }
        }
    }

    private _upCall = () => {
        this._isDown = false;

        if(this.move > 0 || this.move < -this._maxMove) {
            this.move = Math.min(0, Math.max(this.move, -this._maxMove));
            this.needUpdate = true;
            this.markDirty();
        }
    }
}