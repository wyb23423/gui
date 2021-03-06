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

    transform(m: Matrix | number[][], isRight?: boolean){
        if(m instanceof Matrix){
            m = m.toArray();
        }
        const thisArr = this.toArray();
        let left = m, right = thisArr;
        if(isRight) {
            left = thisArr;
            right = m;
        };

        this.a = left[0][0] * right[0][0] + left[0][1] * right[1][0];
        this.c = left[0][0] * right[0][1] + left[0][1] * right[1][1];
        this.e = left[0][0] * right[0][2] + left[0][1] * right[1][2] + left[0][2];

        this.b = left[1][0] * right[0][0] + left[1][1] * right[1][0];
        this.d = left[1][0] * right[0][1] + left[1][1] * right[1][1];
        this.f = left[1][0] * right[0][2] + left[1][1] * right[1][2] + left[1][2];

        return this;
    }

    // 矩阵求逆
    invert() {
        // |A| == 0, 矩阵不可逆, 使用js最小精度求近似值
        // 矩阵不可逆的情况对于变换矩阵而言出现几率通常较低
        const det = this.a * this.d - this.b * this.c || Number.EPSILON;

        return new Matrix(
            this.d / det, -this.c / det, (this.c * this.f - this.d * this.e) / det,
            -this.b / det, this.a / det, (this.b * this.e - this.a * this.f) / det
        );
    }
}

/**
* 矩阵相乘
*/
// export function mul(...m: number[][][]){
//     if(!m.length) {
//         return [];
//     }
//     if(m.length === 1) {
//         return m[0];
//     }

//     return m.reduce(_mul);
// }

// function _mul(left: number[][], right: number[][]){
//     let r:number, l: number;

//     try {
//         r = left.length || 0;
//         l = right[0].length || 0;
//     } catch(e) {
//         return console.error(e), [];
//     }

//     const m: number[][] = [];
//     for(let i=0; i<r; i++){
//         m[i] = [];

//         for(let j=0; j<l; j++){
//             if(Array.isArray(left[i])){
//                 m[i][j] = left[i].reduce((a, lv, k) => {
//                     let rv = 0;

//                     if(right[k] && right[k][j] != null){
//                         rv = right[k][j];
//                     } else {
//                         console.error(`${JSON.stringify(right)} ${k}行${j}列不存在`);
//                     }

//                     return a + lv * rv;
//                 }, 0)
//             } else {
//                 m[i][j] = 0;
//             }
//         }
//     }

//     return m;
// }