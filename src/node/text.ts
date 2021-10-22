/* eslint-disable accessor-pairs */
/**
 * 文本
 * 解析文本性能消耗较大，大段文本尽可能使用静态文本
 */
import Canvas2DElement from './element';
import { makeCheckExist } from '../tool/util';
import { getLineHeight, getWidth } from '../core/text';
import { isEqual } from '../tool/color';
import { devicePixelRatio } from '../config';
// ==================================================

const isFontStyle = makeCheckExist('fontStyle fontVariant fontWeight fontSize fontFamily');
const canModifyTextMap = makeCheckExist('lineHeight letterSpacing textWarp lineClamp indent strokeWidth text');

// ============================================
export default class TextBlock extends Canvas2DElement {
  public readonly type: string = 'text';

  private textMap: TextMap[] = [];
  private text: string = '';

  private _textAlign: TextAlign = 'left'; // 文本横向对齐
  private _verticalAlign: VerticalAlign = 'top'; // 文本垂直对齐

  private _strokeColor?: string = 'rgba(0, 0, 0, 1)'; // 描边颜色
  private _strokeWidth: number = 0; // 描边宽度
  private _lineHeight: number = 0; // 行高
  private _letterSpacing: number = 0; // 字间距
  private _textWarp: TextWarp = 'warp'; // 是否换行
  private _indent: number = 0;
  private _lineClamp: number = 1;

  private _font: Array<Nullable<string>> = [null, null, null, '12px', 'sans-serif']; // 文本设置

  private _modifyText: boolean = false;

  public constructor(id: string | number) {
    super(id);

    this.style.height = 0; // 清除默认高设置
    this.style.color = ''; // 默认使用父级颜色
  }

  public set fontStyle(style: FontStyle) {
    this._setFont(style, 0);
  }

  public set fontVariant(style: 'normal' | 'small-caps') {
    this._setFont(style, 1);
  }

  public set fontWeight(style: FontWeight) {
    if (typeof style === 'number') {
      style = <FontWeight>`${style}`;
    }

    this._setFont(<string>style, 2);
  }

  public set fontSize(style: number | string) {
    if (typeof style === 'number') {
      style = `${style * devicePixelRatio()}px`;
    } else {
      style = style.replace(/^(\d+)(.*)$/, (_: string, size: string, symbol: string) => {
        return `${+(size || 12) * devicePixelRatio()}${symbol || 'px'}`;
      });
    }

    this._setFont(style, 3);
  }

  public set fontFamily(style: string) {
    this._setFont(style, 4);
  }

  /**
   * 设置文本样式
   */
  public setTextStyle(key: string | TextStyle, value?: unknown) {
    this._modifyText = false;
    if (typeof key === 'string') {
      this._setTextStyle([key, value]);
    } else {
      Object.entries(key).forEach(this._setTextStyle, this);
    }

    if (this._modifyText) {
      if ((!this.style.height && this.style.top == null) || (!this.style.width && this.style.left == null)) {
        this.needUpdate = true;
      }
    }

    return this;
  }

  public async calcSize() {
    await super.calcSize();

    this._parseText();

    // 高默认用文本高填充
    if (this.height <= 0) {
      this.height = 0;

      const last = this.textMap[this.textMap.length - 1];
      if (last) {
        this.height = last.y + last.height;
      }
    }
  }

  protected async build(ctx: CanvasRenderingContext2D) {
    const last = this.textMap[this.textMap.length - 1];
    if (last) {
      if (this.style.background) {
        await super.build(ctx);
      }

      ctx.textBaseline = 'top';

      const color = this.style.color || (this.parent instanceof Canvas2DElement ? this.parent.style.color : '');
      if (color && !isEqual(ctx.fillStyle, color)) {
        ctx.fillStyle = color;
      }
      if (this._strokeWidth && this._strokeColor && !isEqual(ctx.strokeStyle, this._strokeColor)) {
        ctx.strokeStyle = this._strokeColor;
      }

      const font = this._font.filter((v) => v != null && v !== '').join(' ');
      if (font && ctx.font !== font) {
        ctx.font = font;
      }

      this.textMap.forEach((v) => {
        const x = this._adjustX(last, v);
        const y = this._adjustY(last, v);
        if (this._strokeWidth) {
          ctx.strokeText(v.char, x, y);
        }
        ctx.fillText(v.char, x, y);
      });
    }
  }

  protected beforeUpdate() {
    super.beforeUpdate();

    this.style.border = 0;
  }

  private _parseText() {
    this.textMap.length = 0;

    if (this.text) {
      const ctx = this.getRenderer()?.ctx;
      if (!ctx) {
        return;
      }

      const font = this._font.filter((v) => v != null && v !== '').join(' ');
      const lineHeight = this._lineHeight || getLineHeight(ctx, font);

      if (!(this.style.width && this.width)) {
        this.width = Infinity;
      }

      const ellipsisWidth = getWidth(ctx, '...', font);

      const lines = this.text.replace(/\n*$/, '').split('\n');
      const options = { y: 0, lineHeight, font, ellipsisWidth };

      let maxWidth: number = 0;
      for (const v of lines) {
        this._setTextMap(ctx, v, options);

        const last = this.textMap[this.textMap.length - 1];
        if (last) {
          maxWidth = Math.max(maxWidth, last.x + last.width);
        }

        options.y += lineHeight;

        if (this.height > 0 && options.y > this.height) {
          break;
        }
      }

      if (this.width === Infinity) {
        this.width = maxWidth;
      }
    }
  }

  private _setTextMap(ctx: CanvasRenderingContext2D, line: string, options: SetTextMapOptions) {
    let width: number = 0;
    let lineCount = 1;
    if (!this.textMap.length) {
      width += this._indent;
    }

    for (let i = 0; i < line.length; i++) {
      if (i) {
        width += this._letterSpacing;
      }

      const textWidth = getWidth(ctx, line[i], options.font) + this._strokeWidth;
      const textData = {
        char: line[i],
        x: width,
        y: options.y,
        width: textWidth,
        height: options.lineHeight,
      };

      width += textWidth;

      if (width > this.width) {
        // 加上当前字符大于文本宽度
        if (this._textWarp === 'warp' || lineCount < this._lineClamp) {
          textData.x = 0;
          width = textWidth;
          textData.y += options.lineHeight;
          options.y += options.lineHeight;
          lineCount++;

          if (this.height > 0 && options.y > this.height) {
            return;
          }
        } else {
          return this._addEllipsis(textData, options.ellipsisWidth);
        }
      } else if (
        this._textWarp === 'ellipsis' && // 溢出省略
        lineCount >= this._lineClamp && // 达到最大行数
        i < line.length - 1 && // 不是最后一个字
        width + options.ellipsisWidth > this.width // 加上省略号宽度比文本宽度大
      ) {
        return this._addEllipsis(textData, options.ellipsisWidth);
      }

      this.textMap.push(textData);
    }
  }

  private _addEllipsis(textData: TextMap, ellipsisWidth: number) {
    if (this._textWarp === 'ellipsis') {
      textData.char = '...';
      textData.width = ellipsisWidth;
      this.textMap.push(textData);
    }
  }

  private _setFont(style: string, index: number) {
    const old = this._font[index];
    if (style !== old) {
      this._font[index] = style;

      this._modifyText = true;
      this.markDirty();
    }
  }

  private _setTextStyle([key, value]: [string, unknown]) {
    if (!isFontStyle(key)) {
      const k = key === 'text' ? key : '_' + key;
      if (typeof value === 'number' && key !== 'lineClamp') {
        value *= devicePixelRatio();
      }

      if (Reflect.get(this, k) !== value) {
        Reflect.set(this, k, value);

        if (canModifyTextMap(key)) {
          this._modifyText = true;
        }

        this.markDirty();
      }
    } else {
      Reflect.set(this, key, value);
    }
  }

  private _adjustX(last: TextMap, data: TextMap) {
    const more = this.width - last.x - last.width;
    if (more > 0 && data.y === last.y) {
      if (this._textAlign === 'center') {
        return data.x + more / 2;
      }

      if (this._textAlign === 'right') {
        return data.x + more;
      }
    }

    return data.x;
  }

  private _adjustY(last: TextMap, data: TextMap) {
    const more = this.height - last.y - last.height;
    if (more > 0) {
      if (this._verticalAlign === 'middle') {
        return data.y + more / 2;
      }

      if (this._verticalAlign === 'bottom') {
        return data.y + more;
      }
    }

    return data.y;
  }
}
