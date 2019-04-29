/**
 * 堆栈式容器
 * 垂直排列时-子元素top/bottom为其上下间隙，百分比height/top/bottom视为0;
 * 横向排列时-子元素left/right为其左右间隙，百分比width/left/right视为0;
 */
import { Container } from "./container";
import { parseSize } from "../core/dom";

export class Stack extends Container {
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
            this.setChildrenProps('needUpdate', true);
        }
    }

    async calcSize() {
        await super.calcSize();

        let sizeKey: 'height' | 'width' = 'height';
        let otherSizeKey: 'height' | 'width' = 'width'
        let positionKey: 'left' | 'top' = 'top';
        if(!this._isVertical) {
            sizeKey = 'width';
            positionKey = 'left';
            otherSizeKey = 'height';
        }
        const oldSize = this[sizeKey];
        this[sizeKey] = 0;

        const [size, max] = await this._calcSize(sizeKey, positionKey, otherSizeKey);

        this[sizeKey] = oldSize || size;
        this[otherSizeKey] = this[otherSizeKey] || max;
    }

    private async _calcSize(
        sizeKey: 'height' | 'width',
        positionKey: 'left' | 'top',
        otherSizeKey: 'height' | 'width'
    ) {
        let size: number = 0;
        let max: number = 0;
        const positionOtherKey: 'right' | 'bottom' = positionKey === 'left' ? 'right' : 'bottom';

        for(const v of Array.from(this.children).sort((a, b) => a.index - b.index)){
            size += parseSize(v.style[positionKey], 0);
            v[positionKey] = size;

            await v.calcSize();
            size += v[sizeKey] + parseSize(v.style[positionOtherKey], 0);
            max = Math.max(max, v[otherSizeKey]);

            v.isVisible = v[sizeKey] ? v.isVisible : false;
        }

        return [size, max];
    }
}