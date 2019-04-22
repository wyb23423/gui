/**
 * 变换矩阵
 */
import { Transform } from "./transform";


export class Matrix extends Transform {
    constructor(
        public a: number = 1, // 水平缩放
        public c: number = 0, // 垂直倾斜
        public e: number = 0, // 水平位移

        public b: number = 0, // 水平倾斜
        public d: number = 1, // 垂直缩放
        public f: number = 0 // 垂直位移
    ) {
        super();
    }

     /**
     * 使用2维数组创建变换矩阵
     */
    static of(data: number[][]){
        return new Matrix(...data[0], ...data[1]);
    }

    /**
     * 重置为单位阵
     */
    toUnit(){
        this.a = this.d = 1;
        this.c = this.e = this.b = this.f = 0;

        return this;
    }

    toArray(){
        return [
            [this.a, this.c, this.e],
            [this.b, this.d, this.f],
            [0, 0, 1]
        ]
    }

    transform(m: Matrix | number[][], right?: boolean){
        if(m instanceof Matrix){
            m = m.toArray();
        }

        [
            [this.a, this.c, this.e],
            [this.b, this.d, this.f]
        ] = right ? mul(this.toArray(), m) : mul(m, this.toArray());

        return this;
    }
}

/**
* 矩阵相乘
*/
export function mul(...m: number[][][]){
    if(!m.length) {
        return [];
    }
    if(m.length === 1) {
        return m[0];
    }

    return m.reduce(_mul);
}

function _mul(left: number[][], right: number[][]){
    let r:number, l: number;

    try {
        r = left.length || 0;
        l = right[0].length || 0;
    } catch(e) {
        return console.error(e), [];
    }

    const m: number[][] = [];
    for(let i=0; i<r; i++){
        m[i] = [];

        for(let j=0; j<l; j++){
            if(Array.isArray(left[i])){
                m[i][j] = left[i].reduce((a, lv, k) => {
                    let rv = 0;

                    if(right[k] && right[k][j] != null){
                        rv = right[k][j];
                    } else {
                        console.error(`${JSON.stringify(right)} ${k}行${j}列不存在`);
                    }

                    return a + lv * rv;
                }, 0)
            } else {
                m[i][j] = 0;
            }
        }
    }

    return m;
}