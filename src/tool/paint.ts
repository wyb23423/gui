// 画一个圆弧
export function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle: number,
  endAngle: number,
  rotation: number,
  anticlockwise: number
) {
  if (Math.abs(rx - ry) > Number.EPSILON * 2 ** 10) {
    // 椭圆
    ctx.save();

    const scaleX = rx > ry ? 1 : rx / ry;
    const scaleY = rx > ry ? ry / rx : 1;

    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);
    ctx.arc(0, 0, Math.max(rx, ry), startAngle, endAngle, !anticlockwise);

    ctx.restore();
  } else {
    ctx.arc(cx, cy, rx, startAngle, endAngle, !anticlockwise);
  }
}

/**
 * 构建圆角矩形。性能消耗较大, 应减少使用
 *
 * 在 border存在 时圆角处会出现缝隙
 * 且 border越大 缝隙越大
 */
export function buildRadiusPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  borderRadius: number[]
) {
  const radius = borderRadius.map((v) => {
    const res = [v, v];
    if (v <= 1) {
      res[0] *= w;
      res[1] *= h;
    }
    res[0] = Math.min(res[0], w / 2);
    res[1] = Math.min(res[1], h / 2);

    return res;
  });

  ctx.moveTo(x + w, y + radius[1][1]);

  // 右上
  ellipse(ctx, x + w - radius[1][0], y + radius[1][1], radius[1][0], radius[1][1], 0, -Math.PI / 2, 0, 0);
  // 上
  if (Math.abs(radius[0][0] - w + radius[1][0]) > 1e-3) {
    ctx.lineTo(x + radius[0][0], y);
  }

  // 左上
  ellipse(ctx, x + radius[0][0], y + radius[0][1], radius[0][0], radius[0][1], -Math.PI / 2, Math.PI, 0, 0);
  // 左
  if (Math.abs(h - radius[0][1] - radius[3][1]) > 1e-3) {
    ctx.lineTo(x, y + h - radius[3][1]);
  }

  // 左下
  ellipse(ctx, x + radius[3][0], y + h - radius[3][1], radius[3][0], radius[3][1], Math.PI, Math.PI / 2, 0, 0);
  // 下
  if (Math.abs(w - radius[2][0] - radius[3][0]) > 1e-3) {
    ctx.lineTo(x + w - radius[2][0], y + h);
  }

  // 右下
  ellipse(ctx, x + w - radius[2][0], y + h - radius[2][1], radius[2][0], radius[2][1], Math.PI / 2, 0, 0, 0);
  // 右
  if (Math.abs(radius[1][1] - h + radius[2][1]) > 1e-3) {
    ctx.lineTo(x + w, y + radius[1][1]);
  }
}

/**
 * 创建路径, 可用于检测一个点是否在节点内部
 */
export function buildPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius?: number[]
) {
  ctx.beginPath();
  if (borderRadius) {
    buildRadiusPath(ctx, x, y, width, height, borderRadius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.closePath();
}
