/**
 * 容器元素基类
 */
import Canvas2DElement from './element';
import { findIndexByBinary } from '../tool/util';
import { buildPath } from '../tool/paint';

export default class Canvas2DContainer extends Canvas2DElement {
  public readonly type: string = 'container';

  public children: Canvas2DElement[] = [];

  public get needUpdate() {
    return this._needUpdate;
  }

  public set needUpdate(needUpdate: boolean) {
    if (needUpdate !== this._needUpdate) {
      this._needUpdate = needUpdate;
      if (needUpdate) {
        this.children.forEach((v) => (v.needUpdate = true));
        this.updateStackParent();
      }
    }
  }

  public remove(el: Canvas2DElement, dispose: boolean = true) {
    if (el) {
      const i = this.children.findIndex((v) => v === el);
      if (i >= 0) {
        el.parent = undefined;
        this.children.splice(i, 1);

        if (dispose) {
          el.dispose();
        }

        this.markDirty();
      }
    }

    return this;
  }

  public add(el: Canvas2DElement) {
    if (el) {
      const parent = el.parent;

      if (parent !== this) {
        if (parent) {
          parent.remove(el, false);
        }
        el.parent = this;
        el.left = el.top = undefined;
        el.needUpdate = true;

        el.index = this.children.length;
        const index = findIndexByBinary(
          (mid) => el.style.zIndex - this.children[mid].style.zIndex || 1,
          this.children.length
        );
        this.children.splice(index, 0, el);
        this.markDirty();
      }
    }

    return this;
  }

  public dispose() {
    super.dispose();

    this.children.forEach((v) => {
      v.parent = undefined;
      v.dispose();
    });
    this.children.length = 0;
  }

  /**
   * 查找元素
   */
  public find(id: string | number): Nullable<Canvas2DElement> {
    if (id === this.id) {
      return this;
    }

    for (const el of this.children) {
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

  public async draw(ctx: CanvasRenderingContext2D) {
    await super.draw(ctx);

    // 不显示/透明度为0/缩放为0, 子元素一定不会显示
    if (!(this.isVisible && this.style.opacity && this.style.scale[0] && this.style.scale[1])) {
      return ctx.restore();
    }

    if (this.style.clip) {
      if (this.width <= 0 || this.height <= 0) {
        return ctx.restore();
      }

      ctx.save();
      buildPath(
        ctx,
        this.style.border / 2,
        this.style.border / 2,
        this.width - this.style.border * 2,
        this.height - this.style.border * 2,
        this.style.borderRadius
      );
      ctx.clip();
    }

    await this._renderChildren(ctx);
  }

  protected afterBuild(ctx: CanvasRenderingContext2D) {
    // 容器暂时不重置ctx
    return ctx;
  }

  private _renderChildren(ctx: CanvasRenderingContext2D): Promise<void> {
    return new Promise((resolve) => {
      const _render = async (i: number) => {
        const node = this.children[i++];
        if (node) {
          await node.draw(ctx);
          _render(i);
        } else {
          if (this.style.clip) {
            ctx.restore();
          }

          ctx.restore();
          resolve();
        }
      };

      _render(0);
    });
  }
}
