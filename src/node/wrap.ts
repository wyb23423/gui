/**
 * 子元素横向堆叠并在放不下时自动换行的容器
 * 子元素top/bottom为其上下间隙, 百分比设置无效
 * 子元素left/right为其左右间隙
 */
import { parseSize } from '../tool/util';
import Canvas2DElement from './element';
import Stack from './stack';

export default class WrapContainer extends Stack {
  public readonly type: string = 'wrapContainer';

  public async calcSize() {
    await super.calcSize();
    if (this.style.clip && this.width <= 0) {
      return;
    }

    this.height = await this._doChildrenPostion();
  }

  /**
   * 子元素定位
   */
  private async _doChildrenPostion() {
    let x = 0;
    const lines = [{ height: 0, nodes: [] as Canvas2DElement[] }];

    for (const child of this.children) {
      if (!child.isVisible) {
        continue;
      }

      await child.calcSize();

      const style = child.style;
      const left = parseSize(style.left ?? 0, this.width);

      if (x > 0 && x + left + child.width > this.width) {
        x = 0;
        lines.push({ height: 0, nodes: [] });
      }

      const top = parseSize(style.top ?? 0, 0);
      const bottom = parseSize(style.bottom ?? 0, 0);
      const line = lines[lines.length - 1];
      line.height = Math.max(line.height, top + child.height + bottom);

      x += left;
      child.left = x;
      x += child.width + parseSize(style.right ?? 0, this.width);
    }

    let height = 0;
    lines.forEach((item) => {
      for (const node of item.nodes) {
        node.top = (item.height - node.height) / 2 + height;
      }

      height += item.height;
    });

    return height;
  }
}
