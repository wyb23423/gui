import { join } from "path";

/// <reference lib="es2017.object" />

/**
 * 创建一个纯函数的缓存版本
 */
export function cached<T>(fn: (...arg: any[]) => T, maxSize?: number): (...arg: any[]) => T {
    const cache:Map<any, any> = new Map();

    return (...arg: any[]) => {
        const key = arg.join(':');

        if(!cache.has(key)) {
            if(maxSize && cache.size >= maxSize) {
                cache.delete(cache.keys().next().value);
            }
            cache.set(key, fn.apply(null, arg));
        }

        return cache.get(key);
    }
}

/**
 * 深复制对象
 */
export function clone(obj: any){
    if(typeof obj === 'object' && obj !== null){
        let res: any;

        if(obj instanceof Map){
            res = new Map();
            obj.forEach((v, k) => res.set(k, clone(v)));
        } else if(obj instanceof Set) {
            res = new Set();
            obj.forEach(v => res.add(clone(v)));
        } else if(Array.isArray(obj)){
            res = obj.map(clone);
        } else {
            res = {};
            for(let [k, v] of Object.entries(obj)){
                res[k] = clone(v);
            }
        }

        return res;
    } else {
        return obj;
    }
}

const imgReg = /\.(jpg|png|gif|jpeg)$/i;
export function isImg(str: any){
    if(typeof str === 'string'){
        return imgReg.test(str) || str.startsWith('data:image/');
    }

    return false;
}

/**
 * 创建一个检测一个字符串是否在一系列字符串内的函数+
 * @param str 用于检测的系列字符串组成的字符串，以空格分隔
 * @param ignore 是否忽略大小写
 */
export function makeCheckExist(str: string, ignore?: boolean){
    let keys = str.split(' ');
    if(ignore){
        keys = keys.map(v => v.toLowerCase());
    }

    return function(k: string){
        if(ignore) {
            k = k.toLowerCase();
        }

        return keys.includes(k);
    }
}

/**
 * 判断一个数值是否是0, 误差为Number.EPSILON
 */
export function isZero(val: number) {
    return val > -Number.EPSILON && val < Number.EPSILON;
}

/**
 * 获取闭区间[min, max]内的随机整数, 四舍五入
 * 若max < min则闭区间为[max, min]
 */
export function randomInt(min: number, max: number){
    if(max === min) return Math.round(max);

    if(max < min) {
        [min, max] = [max, min];
    }

    return Math.round(Math.random() * (max - min) + min);
}

/**
 * 二分法查找插入位置
 * @param compare 比较函数, 返回值<=0时, 插入位置<=mid, 反之>mid
 * @param len 数组长度
 */
export function findIndexByBinary(compare: (mid: number) => number, len: number) {
    let low = 0, high = len - 1, mid = 0;
    while(low <= high){
        mid = Math.floor((high + low) / 2);
        const res = compare(mid);
        if(res < 0){
            high = mid - 1;
        } else if(res > 0){
            low = mid + 1;
        } else {
            return mid;
        }
    }

    return low;
}

/**
 * 下/中划线转驼峰
 */
export const line2hump = cached((str: string) => {
    return str.replace(/[-_]+(\w)/g, (_, w: string) => w.toUpperCase());
})

/**
 * 驼峰转下/中划线
 */
export const hump2line = cached((str: string, line: string = '-') => {
    return str.replace(/[A-Z]/g, (w: string) => line + w.toLowerCase());
})

export const createId = (() => {
    const ids: Set<string | number> = new Set();
    let num: number = 0;

    return function(id: string | number) {
        if(ids.has(id)) {
            id = `${Date.now().toString(16)}${num.toString(16).padStart(6, '0')}`
            num++;
        }
        ids.add(id);

        return id;
    }
})();

export function Mixin(...source: Function[]) {
    return (target: Function) => {
        const proto = target.prototype;
        source.forEach(s =>
            Reflect.ownKeys(s.prototype).forEach(key => {
                if (!(isNotMixinKey(<string>key) || Reflect.has(proto, key))) {
                    const desc = Object.getOwnPropertyDescriptor(s.prototype, key);
                    Object.defineProperty(proto, key, desc);
                }
            })
        )
    }
}
const isNotMixinKey = makeCheckExist('constructor prototype name');