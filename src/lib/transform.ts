import Matrix from './matrix';

export default class Transform {
  // eslint-disable-next-line no-unused-vars
  public transform(_m: Matrix | number[][]) {
    //
  }

  public copy(source: Transform) {
    Object.assign(this, source);

    return this;
  }

  public rotate(rotation: number) {
    if (rotation) {
      rotation *= Math.PI / 180;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      this.transform([
        [cos, -sin, 0],
        [sin, cos, 0],
        [0, 0, 1],
      ]);
    }

    return this;
  }

  public scale(sx: number | number[] = 1, sy: number = 1) {
    if (Array.isArray(sx)) {
      sy = sx[1];
      sx = sx[0];
    }

    if (sx !== 1 || sy !== 1) {
      this.transform([
        [sx, 0, 0],
        [0, sy, 0],
        [0, 0, 1],
      ]);
    }

    return this;
  }

  public translate(x: number | number[] = 0, y: number = 0) {
    if (Array.isArray(x)) {
      y = x[1];
      x = x[0];
    }

    if (x || y) {
      this.transform([
        [1, 0, x],
        [0, 1, y],
        [0, 0, 1],
      ]);
    }

    return this;
  }
}
