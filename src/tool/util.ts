/// <reference lib="es2017.object" />

/**
 * 创建一个纯函数的缓存版本
 */
export function cached<P, T>(fn: (arg: P) => T): (arg: P) => T {
    const cache:Map<any, any> = new Map();

    return (arg: any) => {
        if(!cache.has(arg)){
            cache.set(arg, fn(arg));
        }

        return cache.get(arg);
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

const imgReg = /\.(jpg|png|gif|jpeg|)/i;
export function isImg(str: any){
    if(typeof str === 'string'){
        return imgReg.test(str);
    }

    return false;
}

export function makeCheckExist(str: string, ignore?: boolean){
    const keys = str.split(' ');

    return function(k: string){
        if(ignore) {
            k = k.toLowerCase();
        }

        return keys.includes(k);
    }
}