/**
 * 包围盒
 */
import { Matrix, mul } from 'src/lib/matrix';

export class BoundingRect {
    constructor(
        public x: number = 0,
        public y: number = 0,
        public w: number = 0,
        public h: number = 0,
    ){}

    toArray(){
        return [
            [this.x, this.x + this.w, this.x + this.w, this.x],
            [this.y, this.y, this.y + this.h, this.y + this.h],
            [1, 1, 1, 1]
        ]
    }

    transform(m: Matrix){
        const arr = mul(m.toArray(), this.toArray());

        this.x = Math.min(this.x, ...arr[0]);
        this.y = Math.min(this.y, ...arr[1]);
        this.w = Math.max(this.x, ...arr[0]) - this.x;
        this.h = Math.max(this.y, ...arr[1]) - this.y;

        return this;
    }
}