/* eslint-disable no-useless-concat */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-fallthrough */

/**
 * 样式
 */
import { CanvasGradient, Canvas } from '@tarojs/taro';
import { makeCheckExist } from '../tool/util';
import { getImg, disposeImg } from './resource';
import { parseColor, stringify, isEqual } from '../tool/color';
import { devicePixelRatio } from '../config';

// ====================================================
type CompositeOperation =
  | 'source-over'
  | 'source-in'
  | 'source-out'
  | 'source-atop'
  | 'destination-over'
  | 'destination-in'
  | 'destination-out'
  | 'destination-atop'
  | 'lighter'
  | 'darken'
  | 'copy'
  | 'xor';

interface GradientParams {
  x: [number, number];
  y: [number, number];
  keys: Array<[number, string]>;
}
export interface IStyle {
  background?: string | GradientParams | CanvasGradient;
  color?: string;
  /** 是否裁剪 */
  clip?: boolean;

  src?: string;

  border?: number;
  borderColor?: string;
  borderRadius?: number | number[];
  borderStyle?: number[];

  opacity?: number;

  width?: number | string;
  height?: number | string;

  rotation?: number;

  scaleX?: number;
  scaleY?: number;
  scale?: number | number[];

  left?: number | string;
  right?: number | string;
  top?: number | string;
  bottom?: number | string;

  origin?: number | number[];
  originX?: number;
  originY?: number;

  cellId?: number;
  cellWidth?: number | string;
  cellHeight?: number | string;

  zIndex?: number;

  /**
   * 重叠处理, 需要计算好怎么使用，否则容易绘制达不到预期
   * 常用于最后绘制背景大图
   */
  compositeOperation?: CompositeOperation;
}
// ==========================================================================

/**
 * 将数据解析为有4个元素的数组
 */
function parseNumArr(data: number | number[]) {
  const res: number[] = new Array(4).fill(0);
  if (Array.isArray(data)) {
    switch (data.length) {
      case 1:
        res[0] = res[1] = data[0];
      case 2:
        res[2] = res[0];
      case 3:
        res[3] = res[1];
        break;
      default:
        Object.assign(res, data);
    }
  } else if (typeof data === 'number') {
    res.fill(data);
  }

  return res.map((v) => v * devicePixelRatio());
}

function isGradientParams(color: IStyle['background']): color is GradientParams {
  if (typeof color === 'object' && color) {
    return Reflect.has(color, 'x') && Reflect.has(color, 'y') && Reflect.has(color, 'keys');
  }

  return false;
}

const isTransformKey = makeCheckExist(
  'rotation left top bottom right' + ' ' + 'scale scaleX scaleY width height' + ' ' + 'origin originX originY'
);

export class Style implements IStyle {
  public background?: string | GradientParams | CanvasGradient;
  public color: string = 'rgba(0, 0, 0, 1)';

  public src?: string; // 图片路径

  public border: number = 0;
  public borderColor: string = 'rgba(0, 0, 0, 1)';
  public borderRadius?: number[];
  public borderStyle: number[] = [];

  public opacity: number = 1;

  public width: number | string = '100%';
  public height: number | string = '100%';

  public rotation: number = 0;

  public scale: number[] = [1, 1];

  public left?: number | string;
  public right?: number | string;
  public top?: number | string;
  public bottom?: number | string;

  public zIndex: number = 0;

  public clip: boolean = false;
  public compositeOperation: CompositeOperation = 'source-over';
  public origin: number[] = [0.5, 0.5];

  private _res: Set<string> = new Set(); // 节点已加载过的图片资源
  private _background?: string | CanvasGradient;

  public set(key: string | IStyle, value: any) {
    if (typeof key === 'string') {
      return this.attr([key, value]);
    } else {
      return Object.entries(key).map(this.attr, this).includes(true);
    }
  }

  /**
   * 根据样式设置绘制状态
   * @param width 节点的宽
   * @param height 节点的高
   */
  public build(ctx: CanvasRenderingContext2D) {
    if (this.border) {
      ctx.setLineDash(this.borderStyle);
      if (!isEqual(ctx.strokeStyle, this.borderColor)) {
        ctx.strokeStyle = this.borderColor;
      }
      if (ctx.lineWidth !== this.border) {
        ctx.lineWidth = this.border;
      }
    }

    if (!isEqual(ctx.fillStyle, this._background)) {
      if (!this._background) {
        if (isGradientParams(this.background)) {
          const dpr = devicePixelRatio();
          const { x, y, keys } = this.background;
          this._background = ctx.createLinearGradient(x[0] * dpr, y[0] * dpr, x[1] * dpr, y[1] * dpr);
          for (const item of keys) {
            this._background.addColorStop(item[0], item[1]);
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          this._background = this.background || 'rgba(255, 255, 255, 0)';
        }
      }

      ctx.fillStyle = this._background;
    }

    ctx.globalCompositeOperation = this.compositeOperation;
  }

  /**
   * 设置全局透明度
   */
  public setAlpha(ctx: CanvasRenderingContext2D) {
    const alpha = Math.max(0, Math.min(1, this.opacity));
    if (ctx.globalAlpha !== alpha) {
      ctx.globalAlpha = alpha;
    }
  }

  public dispose() {
    this._res.forEach(disposeImg);
    this._res.clear();
    this._background = undefined;
  }

  /**
   * 判断新值与旧值是否相等
   */
  public equal(key: string, value: any) {
    let old = Reflect.get(this, key);
    if (old == null) {
      old = Reflect.get(this, key.substr(0, key.length - 1));
    }

    if (key === 'border') {
      value *= devicePixelRatio();
    } else if (key === 'background' && typeof value === 'string') {
      value = stringify(parseColor(value), 'rgba');
    } else if (key === 'borderRadius') {
      value = parseNumArr(value);
    } else if (key === 'origin') {
      value = Array.isArray(value) ? value : [value, value];
    }

    if (Array.isArray(old)) {
      if (Array.isArray(value)) {
        if (key === 'borderStyle' && old.length !== value.length) {
          return false;
        }

        return old.every((v, i) => v === value[i]);
      }

      if (key.endsWith('X')) {
        return old[0] === value;
      }

      if (key.endsWith('Y')) {
        return old[1] === value;
      }

      return old.every((v) => v === value);
    }

    return old === value;
  }

  /**
   * 获取Image
   * @param src 图片路径
   */
  public loadImg(canvas?: Canvas, src = this.src) {
    if (!canvas) {
      console.error('未找到画布');
      return Promise.resolve();
    }

    if (!src || typeof src !== 'string') {
      console.error('无效的图片路径');
      return Promise.resolve();
    }

    const isFirst = !this._res.has(src);
    this._res.add(src);

    return getImg(canvas, src, isFirst);
  }

  private attr([key, value]: [string, any]) {
    let isModifyTransform = isTransformKey(key);
    if (isModifyTransform) {
      isModifyTransform = isModifyTransform && !this.equal(key, value);
    }

    if (key === 'background') {
      this._background = undefined;
      typeof value === 'string' && (value = stringify(parseColor(value), 'rgba'));
    }

    switch (key) {
      case 'borderRadius':
        this[key] = parseNumArr(value);
        break;
      case 'scale':
      case 'origin':
        this[key] = Array.isArray(value) ? value : [value, value];
        break;
      case 'scaleX':
      case 'originX':
      case 'scaleY':
      case 'originY':
        // eslint-disable-next-line no-case-declarations
        const k = key.substr(0, key.length - 1) as 'scale' | 'origin';
        this[k][key.endsWith('X') ? 0 : 1] = value;
        break;
      case 'border':
        value *= devicePixelRatio();
      default:
        Reflect.set(this, key, value);
    }

    return isModifyTransform;
  }
}
