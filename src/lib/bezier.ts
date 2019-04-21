/**
 * 贝塞尔曲线相关
 */
import { cached, isZero } from "../tool/util";

// 计算杨辉三角第n行的数
const YHTriangle = cached((n: number) => {
    n = Math.trunc(n);
    if(n < 0) return [];

    const mi: number[] = [];
    mi[0] = mi[1] = 1;
    for (let i = 3; i <= n; i++) {
        const t = mi.slice(0, i-1);

        mi[0] = mi[i - 1] = 1;
        for (let j = 0; j < i - 2; j++) {
            mi[j + 1] = t[j] + t[j + 1];
        }
    }

    return mi;
})

/**
 * 计算n阶贝塞尔函数的值
 * */
export function bezier(t: number, ...p: number[]){
    const n = p.length - 1;
    const mi = YHTriangle(n + 1);

    return p.reduce((a, b, i) => a + mi[i] * b * (1 - t) ** (n - i) * t ** i, 0);
}

/**
 * 计算三阶贝塞尔函数在[0, 1]上的非单调极值
 */
export function cubicExtrema(p0: number, p1: number, p2: number, p3: number) {
    const a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2;
    const b = 6 * p2 - 12 * p1 + 6 * p0;
    const c = 3 * p1 - 3 * p0;

    const extremum = [];
    if(isZero(a)){
        if(!isZero(b)){
            const t1 = -c / b;
            if (t1 >= 0 && t1 <= 1) {
                extremum.push(t1);
            }
        }
    }
    else {
        const disc = b * b - 4 * a * c;
        if(!isZero(disc) && disc > 0){
            const discSqrt = Math.sqrt(disc);
            const t1 = (-b + discSqrt) / (2 * a);
            const t2 = (-b - discSqrt) / (2 * a);

            if (t1 >= 0 && t1 <= 1) {
                extremum.push(t1)
            }
            if (t2 >= 0 && t2 <= 1) {
                extremum.push(t2);
            }
        }
    }

    return extremum;
}

/**
 * 计算二阶贝塞尔函数在[0, 1]上的极值
 */
export function quadraticExtremum(p0: number, p1: number, p2: number) {
    var divider = p0 + p2 - 2 * p1;
    if (divider === 0) {
        // p1 is center of p0 and p2
        return 0.5;
    }
    else {
        return Math.max(Math.min((p0 - p1) / divider, 1), 0);
    }
}