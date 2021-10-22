/**
 * 图片节点
 */
import { Canvas } from '@tarojs/taro';
import Canvas2DElement from './element';
import { IStyle } from '../core/style';
import { isZero, parseSize } from '../tool/util';
import { buildPath } from '../tool/paint';

export default class Canvas2DImage extends Canvas2DElement {
  public readonly type: string = 'image';

  private _cellId: number = -1;
  private _cellWidth?: number | string;
  private _cellHeight?: number | string;
  private _canvas?: Canvas;

  constructor(id: string | number) {
    super(id);

    this.style.width = this.style.height = 0; // 清除默认宽高设置
  }

  public attr(key: string | IStyle, value?: unknown) {
    if (typeof key === 'string') {
      key = { [key]: value };
    }
    this._setCell(key);
    const modyfySrc = Reflect.has(key, 'src') && key.src !== this.style.src;

    super.attr(key, value);
    if (modyfySrc && !(this.style.width && this.style.height)) {
      this.needUpdate = true;
    }

    return this;
  }

  public dispose() {
    super.dispose();
    this._canvas = undefined;
  }

  public async calcSize() {
    await super.calcSize();

    // 图片尺寸默认为其原尺寸等比缩放
    if (this.width <= 0 || this.height <= 0) {
      const img = await this.style.loadImg(this.getCanvas());

      if (img) {
        if (this.width <= 0 && this.height <= 0) {
          this.width = img.width;
          this.height = img.height;
        } else if (this.width <= 0) {
          this.width = (this.height * img.width) / img.height;
        } else if (this.height <= 0) {
          this.height = (this.width * img.height) / img.width;
        }
      }
    }
  }

  protected async build(ctx: CanvasRenderingContext2D) {
    this.style.build(ctx);
    this.style.setAlpha(ctx);

    const img = await this.style.loadImg(this.getCanvas());
    if (img) {
      const sw = Math.min(parseSize(this._cellWidth ?? 0, img.width), img.width);
      const sh = Math.min(parseSize(this._cellHeight ?? 0, img.height), img.height);

      if (this._cellId >= 0 && sw > 0 && sh > 0) {
        // 精灵图
        const cw = Math.floor(this._cellId + 1) * sw;
        let sx = (cw % img.width) - sw;
        let sy = Math.floor(cw / img.width) * sh;
        if (isZero(cw % img.width)) {
          sx = img.width - sw;
          sy -= sh;
        }
        sx = Math.max(Math.min(sx, img.width - sw), 0);
        sy = Math.max(Math.min(sy, img.height - sh), 0);

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, this.width, this.height);
      } else {
        // 整图
        ctx.drawImage(img, 0, 0, this.width, this.height);
      }
    } else {
      buildPath(ctx, 0, 0, 1, 1);
    }
  }

  protected update() {
    this.style.background = '';
    this.style.border = 0; // 图片没有边框，如果需要有，可使用Container的背景图

    return super.update();
  }

  private getCanvas() {
    return this._canvas ?? (this._canvas = this.getRenderer()?.canvas);
  }

  private _setCell(data: IStyle) {
    ['cellId', 'cellWidth', 'cellHeight'].forEach((k) => {
      if (Reflect.has(data, k)) {
        Reflect.set(this, `_${k}`, Reflect.get(data, k));
        Reflect.deleteProperty(data, k);
      }
    });
  }
}
