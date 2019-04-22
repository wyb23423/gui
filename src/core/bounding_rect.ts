/**
 * 包围盒
 */
import { Matrix, mul } from '../lib/matrix';

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
        ];
    }

    transform(m: Matrix,){
        const arr = mul(m.toArray(), this.toArray());

        this.x = Math.min(...arr[0]);
        this.y = Math.min(...arr[1]);
        this.w = Math.max(...arr[0]) - this.x;
        this.h = Math.max(...arr[1]) - this.y;

        return this;
    }

    contain(x: number, y: number){
        return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
    }

    intersect(
        x: BoundingRect | number = 0,
        y: number = 0,
        w: number = 0,
        h: number = 0
    ) {
        if(x instanceof BoundingRect){
            y = x.y;
            w = x.w;
            h = x.h;
            x = x.x;
        }

        const ax0 = this.x;
        const ax1 = this.x + this.w;
        const ay0 = this.y;
        const ay1 = this.y + this.h;

        const bx0 = x;
        const bx1 = x + w;
        const by0 = y;
        const by1 = y + h;

        return !(ax1 < bx0 || bx1 < ax0 || ay1 < by0 || by1 < ay0);
    }
}