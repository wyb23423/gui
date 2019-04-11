/**
 * 变换矩阵
 */

export class Matrix {
    constructor(
        public a: number = 1, // 水平缩放
        public b: number = 0, // 水平倾斜
        public c: number = 0, // 垂直倾斜
        public d: number = 1, // 垂直缩放
        public e: number = 0, // 水平位移
        public f: number = 0 // 垂直位移
    ) {}

    toArray(){
        return new Float32Array([
            this.a, this.b, this.c, this.d,
            this.e, this.f, 0, 0, 1
        ]);
    }
}