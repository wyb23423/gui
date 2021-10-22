/**
 * 节点基类
 * 各尺寸尽可能为偶数
 */
import Matrix from '../lib/matrix';
import Canvas2DContainer from './container';
import BoundingRect from '../core/boundingRect';
import { Style, IStyle } from '../core/style';
import { createId, parseSize, removeId } from '../tool/util';
import { buildPath } from '../tool/paint';
import Canvas2dRenderer from '../renderer';
import { devicePixelRatio } from '../config';

export default class Canvas2DElement {
  public readonly type: string = 'element';

  public index: number = 0; // 在父容器内部的添加顺序
  public parent?: Canvas2DContainer | Canvas2dRenderer;

  public transform = new Matrix();
  public rect = new BoundingRect();

  public style = new Style();
  public origin: number[] = [0, 0]; // update时计算出的变换中心
  public width: number = 0; // 通过calcSize计算出的width
  public height: number = 0; // 通过calcSize计算出的height
  public left?: number; // 存在时覆盖style.left设置
  public top?: number; // 存在时覆盖style.top设置

  protected _needUpdate: boolean = true; // 是否需要执行update
  private _isVisible: boolean = true; // 是否可见
  private _hadCalc: boolean = false; // 是否已计算过尺寸

  private _parentWidth: number = 0;
  private _parentHeight: number = 0;

  private _dirty: boolean = true;

  public constructor(public id: string | number) {
    this.id = createId(id);
  }

  public get needUpdate() {
    return this._needUpdate;
  }

  public set needUpdate(needUpdate: boolean) {
    if (this._needUpdate !== needUpdate) {
      this._needUpdate = needUpdate;
      this.updateStackParent();
    }
  }

  public get isVisible() {
    return this._isVisible;
  }

  public set isVisible(val: boolean) {
    if (this._isVisible !== val) {
      this._isVisible = val;
      this.updateStackParent();
      this.markDirty();
    }
  }

  public getSize(key: 'width' | 'height') {
    return this[key] / devicePixelRatio();
  }

  public dispose() {
    if (this.parent) {
      this.parent.remove(this, false);
    }

    this.style.dispose();
    this.parent = undefined;

    removeId(this.id);
  }

  public async draw(ctx: CanvasRenderingContext2D) {
    this.beforeUpdate();
    await this.getBoundingRect();
    this.afterUpdate();

    if (this.isPaint()) {
      this.beforeBuild(ctx);
      await this.build(ctx);
      this.afterBuild(ctx);
    }
  }

  /**
   * 设置节点样式
   */
  public attr(key: string | IStyle, value?: unknown) {
    if (typeof key === 'string') {
      key = { [key]: value };
    }

    let isEqual: boolean = true;
    for (const [k, v] of Object.entries(key)) {
      if (!this.style.equal(k, v)) {
        isEqual = false;
        break;
      }
    }

    if (!isEqual) {
      if (this.style.set(key, value)) {
        this.needUpdate = true;
      }

      this.markDirty();
    }

    return this;
  }

  /**
   * 标记节点所在的层需要重绘
   */
  public markDirty() {
    if (!this._dirty) {
      this._dirty = true;
      this.parent?.markDirty();
    }
  }

  /**
   * 获取父级尺寸
   */
  public getParentSize(key: 'width' | 'height') {
    if (key === 'width') {
      return this._parentWidth;
    } else if (key === 'height') {
      return this._parentHeight;
    }

    return 0;
  }

  // ========================钩子函数
  /**
   * 计算节点宽高
   */
  public async calcSize() {
    this.width = parseSize(this.style.width, this._parentWidth);
    this.height = parseSize(this.style.height, this._parentHeight);

    this._hadCalc = true;
  }

  /**
   * 获取节点AABB类包围盒
   */
  protected async getBoundingRect() {
    if (this._needUpdate) {
      await this.update();

      this.rect = new BoundingRect(0, 0, this.width, this.height).transform(this.transform);

      this._needUpdate = false;
    }

    return this.rect;
  }

  protected beforeUpdate() {
    //
  }

  protected async update() {
    this._parentWidth = this._getBaseSize('width');
    this._parentHeight = this._getBaseSize('height');

    if (!this._hadCalc) {
      await this.calcSize();
    }

    this.style.border = Math.min(this.style.border, this.width / 2, this.height / 2);
    if (this.style.border < 0) {
      this.style.border = 0;
    }

    this.origin[0] = this.style.origin[0] * this.width;
    this.origin[1] = this.style.origin[1] * this.height;

    this.updateTransform();
  }

  protected afterUpdate() {
    this._dirty = this._hadCalc = false;
  }

  protected beforeBuild(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const { a, b, c, d, e, f } = this.transform;
    const x = this.style.border / 2; // ctx.stroke() 会以路径做中心为路径着色
    ctx.setTransform(a, b, c, d, e + x, f + x);
  }

  protected async build(ctx: CanvasRenderingContext2D) {
    const border = this.style.border;
    const width = this.width - border;
    const height = this.height - border;

    buildPath(ctx, 0, 0, width, height, this.style.borderRadius);
    this.style.build(ctx);
    this.style.setAlpha(ctx);

    if (this.style.background) {
      ctx.fill();
    }

    if (border && this.style.borderColor) {
      ctx.stroke();
    }
  }

  protected afterBuild(ctx: CanvasRenderingContext2D) {
    ctx.restore();
  }

  // 更新变换矩阵
  protected updateTransform() {
    const style = this.style;

    let x = this.left;
    let y = this.top;
    if (x == null) {
      if (style.left != null) {
        x = parseSize(style.left, this._parentWidth);
      } else if (style.right != null) {
        x = this._parentWidth - parseSize(style.right, this._parentWidth) - this.width;
      } else {
        // x方向没有任何设置, 默认居中
        x = parseSize('50%', this._parentWidth) - this.width / 2;
      }
    }

    if (y == null) {
      if (style.top != null) {
        y = parseSize(style.top, this._parentHeight);
      } else if (style.bottom != null) {
        y = this._parentHeight - parseSize(style.bottom, this._parentHeight) - this.height;
      } else {
        // y方向没有任何设置, 默认居中
        y = parseSize('50%', this._parentHeight) - this.height / 2;
      }
    }

    this.transform
      .toUnit()
      .translate(-this.origin[0], -this.origin[1]) // 变换中心
      .scale(style.scale) // 缩放
      .rotate(style.rotation) // 旋转
      .translate(x + this.origin[0], y + this.origin[1]); // 平移

    // 父节点变换
    if (this.parent instanceof Canvas2DElement) {
      const parent = this.parent;
      this.transform.translate(parent.style.border, parent.style.border).transform(parent.transform);
    }
  }
  // =============================================================

  protected updateStackParent() {
    // 子元素包围盒更新会影响根据父元素包围盒
    const parent = this.parent;
    if (this._needUpdate && parent instanceof Canvas2DContainer && parent.type !== 'container') {
      parent.needUpdate = true;
    }
  }

  // ====================================================================================获取父节点
  protected getParent(filter: (P: NonNullable<Canvas2DElement['parent']>) => boolean) {
    let parent = this.parent;
    while (parent) {
      if (filter(parent)) {
        return parent;
      }

      parent = parent instanceof Canvas2DContainer ? parent.parent : undefined;
    }
  }

  protected getContainerParent(filter: (P: Canvas2DContainer) => boolean) {
    return this.getParent((p) => p instanceof Canvas2DContainer && filter(p)) as Canvas2DContainer | undefined;
  }

  protected getRenderer() {
    return this.getParent((p) => p instanceof Canvas2dRenderer) as Canvas2dRenderer | undefined;
  }
  // =======================================================================================

  // 是否需要绘制
  private isPaint() {
    if (
      this.isVisible &&
      this.style.opacity &&
      this.style.scale[0] &&
      this.style.scale[1] &&
      this.width > 0 &&
      this.height > 0
    ) {
      // 祖先节点可能存在裁剪
      const clipParent = this.getContainerParent((parent) => parent.style.clip);
      if (clipParent) {
        return this.rect.intersect(clipParent.rect);
      }

      // 检测是否在画布区域内
      const renderer = this.getRenderer();
      return renderer ? this.rect.intersect(0, 0, renderer.width, renderer.height) : false;
    }

    return false;
  }

  // 计算父节点尺寸
  private _getBaseSize(key: 'width' | 'height') {
    let base: number = 0;
    if (this.parent instanceof Canvas2DElement) {
      base = this.parent[key];
      if (this.parent.style.border) {
        base -= this.parent.style.border * 2;
      }
    } else if (this.parent instanceof Canvas2dRenderer) {
      base = this.parent[key];
    }

    return Math.max(0, base);
  }
}
