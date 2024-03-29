/**
 * 堆栈式容器
 * 垂直排列时-子元素top/bottom为其上下间隙
 * 横向排列时-子元素left/right为其左右间隙
 */
import { Container } from "./container";
import { parseSize } from "../core/dom";
import { Canvas2DElement } from "./element";

export class Stack extends Container {
    readonly type: string = 'stack';

    private _isVertical: boolean = true; // 是否是垂直排列

    constructor(id: number | string, isStatic?: boolean) {
        super(id, isStatic);

        this.style.width = this.style.height = 0;
    }

    get isVertical() {
        return this._isVertical;
    }

    set isVertical(isVertical: boolean) {
        if(isVertical !== this._isVertical) {
            this._isVertical = isVertical;
            this.needUpdate = true;
        }
    }

    remove(el: Canvas2DElement, dispose: boolean = true){
        super.remove(el, dispose);
        if(!(this.style.width && this.style.height)) {
            this.needUpdate = true;
        }

        return this;
    }

    add(el: Canvas2DElement){
        super.add(el);
        if(!(this.style.width && this.style.height)) {
            this.needUpdate = true;
        }

        return this;
    }

    async calcSize() {
        super.calcSize();

        let sizeKey: 'height' | 'width' = 'height';
        let otherSizeKey: 'height' | 'width' = 'width'
        let positionKey: 'left' | 'top' = 'top';
        if(!this._isVertical) {
            sizeKey = 'width';
            positionKey = 'left';
            otherSizeKey = 'height';
        }
        const oldSize = this[sizeKey];
        this[sizeKey] = this.getParentSize(sizeKey);

        const [size, max] = await this._calcSize(sizeKey, positionKey, otherSizeKey);

        this[sizeKey] = oldSize || size + this.style.border * 2;
        this[otherSizeKey] = this[otherSizeKey] || max + this.style.border * 2;
    }

    private async _calcSize(
        sizeKey: 'height' | 'width',
        positionKey: 'left' | 'top',
        otherSizeKey: 'height' | 'width'
    ) {
        let size: number = 0;
        let max: number = 0;
        const positionOtherKey: 'right' | 'bottom' = positionKey === 'left' ? 'right' : 'bottom';

        const children = Array.from(this.children).sort((a, b) => a.index - b.index);
        for(const v of children){
            size += parseSize(v.style[positionKey], 0);
            v[positionKey] = size;

            if(!(v.isStatic && v._cached)) {
                await v.calcSize();
            }
            size += v[sizeKey] + parseSize(v.style[positionOtherKey], 0);
            max = Math.max(max, v[otherSizeKey]);

            v.isVisible = v[sizeKey] ? v.isVisible : false;
        }

        return [size, max];
    }
}