/**
 * 2维向量
 */
import Matrix from './matrix';
import Transform from './transform';

export default class Vector2 extends Transform {
  public constructor(public x: number = 0, public y: number = x) {
    super();
  }

  /**
   * 使用x及y的最小值创建2维向量
   */
  public static createMin(x: number[] | number, y: number[] | number) {
    if (!Array.isArray(x)) {
      x = [x];
    }
    if (!Array.isArray(y)) {
      y = [y];
    }

    return new Vector2(Math.min(...x), Math.min(...y));
  }

  /**
   * 使用x及y的最大值创建2维向量
   */
  public static createMax(x: number[] | number, y: number[] | number) {
    if (!Array.isArray(x)) {
      x = [x];
    }
    if (!Array.isArray(y)) {
      y = [y];
    }

    return new Vector2(Math.max(...x), Math.max(...y));
  }

  public toMin(v: Vector2) {
    this.x = Math.min(v.x, this.x);
    this.y = Math.min(v.y, this.y);

    return this;
  }

  public toMax(v: Vector2) {
    this.x = Math.max(v.x, this.x);
    this.y = Math.max(v.y, this.y);

    return this;
  }

  /** 向量变换, 右乘矩阵 */
  public transform(m: Matrix | number[][]) {
    if (m instanceof Matrix) {
      m = m.toArray();
    }
    this.x = m[0][0] * this.x + m[0][1] * this.y + m[0][2];
    this.y = m[1][0] * this.x + m[1][1] * this.y + m[1][2];

    return this;
  }
}
