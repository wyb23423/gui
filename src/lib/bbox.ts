/**
 * 计算各种路径的包围盒
 */
import { Vector2 } from "./vector";
import { cubicExtrema, bezier, quadraticExtremum } from "./bezier";

/**
 * 直线
 */
export function line(x1: number, y1: number, x2: number, y2: number){
    const min = Vector2.createMin([x1, x2], [y1, y2]);
    const max = Vector2.createMax([x1, x2], [y1, y2]);

    return [min, max];
}

/**
 * 四阶贝塞尔曲线
 */
export function cubic(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number
){
    const min = Vector2.createMin([x0, x3], [y0, y3]);
    const max = Vector2.createMax([x0, x3], [y0, y3]);

    cubicExtrema(x0, x1, x2, x3).forEach(t => {
        const x = bezier(t, x0, x1, x2, x3);
        min.x = Math.min(min.x, x);
        max.x = Math.max(max.x, x);
    });
    cubicExtrema(y0, y1, y2, y3).forEach(t => {
        const y = bezier(t, y0, y1, y2, y3);
        min.y = Math.min(min.y, y);
        max.y = Math.max(max.y, y);
    });

    return [min, max];
}

/**
 * 三阶贝塞尔曲线
 */
export function quadratic(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number
) {
    const x = bezier(quadraticExtremum(x0, x1, x2), x0, x1, x2);
    const y = bezier(quadraticExtremum(y0, y1, y2), y0, y1, y2);

    return [
        Vector2.createMin([x0, x2, x], [y0, y2, y]),
        Vector2.createMax([x0, x2, x], [y0, y2, y])
    ]
}

/**
 * 弧线
 */
export function arc(
    cx: number, cy: number,
    rx: number, ry: number,
    startAngle: number, endAngle: number,
    anticlockwise: number
){
    const diff = Math.abs(startAngle - endAngle);
    const PI2 = Math.PI * 2;

    if (diff % PI2 < 1e-4 && diff > 1e-4) {
        // 圆
        return [
            new Vector2(cx - rx, cy - ry),
            new Vector2(cx + rx, cy + ry),
        ];
    }

    const x = [], y = [];
    x[0] = Math.cos(startAngle) * rx + cx;
    x[1] = Math.cos(endAngle) * rx + cx;
    y[0] = Math.sin(startAngle) * ry + cy;
    y[1] = Math.sin(endAngle) * ry + cy;

    const min = Vector2.createMin(x, y);
    const max = Vector2.createMax(x, y);

    // to [0, Math.PI * 2]
    startAngle = startAngle % PI2;
    if (startAngle < 0) {
        startAngle = startAngle + PI2;
    }
    endAngle = endAngle % PI2;
    if (endAngle < 0) {
        endAngle = endAngle + PI2;
    }

    if (startAngle > endAngle && !anticlockwise) {
        endAngle += PI2;
    }
    else if (startAngle < endAngle && anticlockwise) {
        startAngle += PI2;
    }
    if (anticlockwise) {
        const tmp = endAngle;
        endAngle = startAngle;
        startAngle = tmp;
    }

    for (let angle = 0; angle < endAngle; angle += Math.PI / 2) {
        if (angle > startAngle) {
            const v = new Vector2(Math.cos(angle) * rx + cx, Math.sin(angle) * ry + cy);

            min.toMin(v);
            max.toMax(v);
        }
    }

    return [min, max];
}