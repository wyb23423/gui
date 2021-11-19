/**
 * canvas层
 */
import { Canvas } from '@tarojs/taro';
import { devicePixelRatio } from './config';
import Canvas2DContainer from './node/container';
import Canvas2DElement from './node/element';
import { findIndexByBinary } from './tool/util';

export default class Canvas2dRenderer {
  public dirty: boolean = true; // 是否需要绘制
  public ctx?: CanvasRenderingContext2D;
  public width = 0;
  public height = 0;

  private roots: Canvas2DElement[] = [];

  // 是否处于绘制过程中
  // 保证上一次绘制完成后才开始下一次绘制
  private isRendering = false;

  public constructor(public canvas?: Canvas) {
    if (canvas) {
      const dpr = devicePixelRatio(false);
      this.width = canvas.width = canvas.width * dpr;
      this.height = canvas.height = canvas.height * dpr;
      this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    }
  }

  public add(el: Canvas2DElement) {
    if (el) {
      const parent = el.parent;
      if (parent !== this) {
        if (parent) {
          parent.remove(el, false);
        }

        el.parent = this;
        el.needUpdate = true;
        el.left = el.top = undefined;

        const index = findIndexByBinary(
          (mid) => el.style.zIndex - this.roots[mid].style.zIndex || 1,
          this.roots.length
        );
        this.roots.splice(index, 0, el);

        this.dirty = true;
      }
    }

    return this;
  }

  public remove(el: Canvas2DElement, dispose: boolean = true) {
    if (el) {
      const i: number = this.roots.findIndex((v) => v === el);
      if (i >= 0) {
        el.parent = undefined;
        this.roots.splice(i, 1);

        if (dispose) {
          el.dispose();
        }

        this.dirty = true;
      }
    }

    return this;
  }

  public dispose() {
    this.roots.forEach((v) => {
      v.parent = undefined;
      v.dispose();
    });

    this.roots.length = 0;
    this.ctx = this.canvas = undefined;
  }

  public beforeRender() {
    this.isRendering = true;
  }

  public render() {
    if (this.dirty && !this.isRendering) {
      this.dirty = false;

      // 异步绘制
      Promise.resolve().then(() => this.isRendering || this._doRender());
    }
  }

  public afterRender() {
    this.isRendering = false;
  }

  public markDirty() {
    this.dirty = true;
  }

  public find(id: string | number) {
    for (const el of this.roots) {
      if (el instanceof Canvas2DContainer) {
        const res = el.find(id);
        if (res) {
          return res;
        }
      } else if (el.id === id) {
        return el;
      }
    }

    return null;
  }

  private _doRender() {
    if (!this.ctx) {
      return;
    }

    this.beforeRender();

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.width, this.height);

    this._render(0);
  }

  private async _render(i: number) {
    if (!this.ctx) {
      return;
    }

    const node = this.roots[i++];
    if (node) {
      await node.draw(this.ctx);
      this._render(i);
    } else {
      this.ctx.restore();
      this.afterRender();
    }
  }
}
