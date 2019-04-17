/**
 * 解析样式
 */
/// <reference path="../types.d.ts" />

export function parseNumArr(data: number | number[]){
    const res = new Array(4).fill(0);
    if(Array.isArray(data)){
        switch(data.length){
            case 1: res[0] = res[1] = data[0];
            case 2: res[2] = res[0];
            case 3:
                res[3] = res[1];
                break;
            default: Object.assign(res, data);
        }
    } else if(typeof data === 'number'){
        res.fill(data)
    }

    return res;
}