/**
 * 堆栈式容器
 * 垂直排列时-子元素top/bottom为其上下间隙
 * 横向排列时-子元素left/right为其左右间隙
 */
import { parseSize } from '../tool/util';
import Canvas2DElement from './element';
import Canvas2DContainer from './container';

export default class Stack extends Canvas2DContainer {
  public readonly type: string = 'stack';

  private _isVertical: boolean = true; // 是否是垂直排列

  public constructor(id: number | string) {
    super(id);

    this.style.width = this.style.height = 0;
  }

  public get isVertical() {
    return this._isVertical;
  }

  public set isVertical(isVertical: boolean) {
    if (isVertical !== this._isVertical) {
      this._isVertical = isVertical;
      this.needUpdate = true;
    }
  }

  public remove(el: Canvas2DElement, dispose: boolean = true) {
    super.remove(el, dispose);
    this.needUpdate = true;

    return this;
  }

  public add(el: Canvas2DElement) {
    super.add(el);
    this.needUpdate = true;

    return this;
  }

  public async calcSize() {
    await super.calcSize();

    // 不是 Stack 之后的处理不进行
    if (this.type !== 'stack') {
      return;
    }

    let sizeKey: 'height' | 'width' = 'height';
    let otherSizeKey: 'height' | 'width' = 'width';
    let positionKey: 'left' | 'top' = 'top';
    if (!this._isVertical) {
      sizeKey = 'width';
      positionKey = 'left';
      otherSizeKey = 'height';
    }
    // 使得子元素尺寸百分比设置能有效
    this[sizeKey] = this.getParentSize(sizeKey);

    const [size, max] = await this._calcSize(sizeKey, positionKey, otherSizeKey);

    this[sizeKey] = size + this.style.border * 2;
    this[otherSizeKey] = this[otherSizeKey] || max + this.style.border * 2;
  }

  private async _calcSize(sizeKey: 'height' | 'width', positionKey: 'left' | 'top', otherSizeKey: 'height' | 'width') {
    let size: number = 0;
    let max: number = 0;
    const positionOtherKey: 'right' | 'bottom' = positionKey === 'left' ? 'right' : 'bottom';

    const children = Array.from(this.children).sort((a, b) => a.index - b.index);
    for (const v of children) {
      if (!v.isVisible) {
        continue;
      }

      size += parseSize(v.style[positionKey] ?? 0, 0);
      v[positionKey] = size;

      await v.calcSize();
      size += v[sizeKey] + parseSize(v.style[positionOtherKey] ?? 0, 0);
      max = Math.max(max, v[otherSizeKey]);

      v.isVisible = v[sizeKey] ? v.isVisible : false;
    }

    return [size, max];
  }
}
