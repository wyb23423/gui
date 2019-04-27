/**
 * 包围盒
 */
import { Matrix } from '../lib/matrix';

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

    extend(other: BoundingRect) {
        const x = Math.min(other.x, this.x);
        const y = Math.min(other.y, this.y);

        this.w = Math.max(other.x + other.w, this.x + this.w) - x;
        this.h = Math.max(other.y + other.h, this.y + this.h) - y;
        this.x = x;
        this.y = y;

        return this;
    }

    transform(m: Matrix,){
        const thisArr = this.toArray();
        const mArr = m.toArray();

        let minX: number, minY: number,
            maxX: number, maxY: number,
            x: number, y: number;
        minX = minY = Number.MAX_VALUE;
        maxX = maxY = -Number.MAX_VALUE

        for(let i=0; i<4; i++) {
            x = mArr[0][0] * thisArr[0][i] + mArr[0][1] * thisArr[1][i] + mArr[0][2];
            y = mArr[1][0] * thisArr[0][i] + mArr[1][1] * thisArr[1][i] + mArr[1][2];

            minX = Math.min(x, minX);
            minY = Math.min(y, minY);

            maxX = Math.max(x, maxX);
            maxY = Math.max(y, maxY);
        }

        this.x = minX;
        this.y = minY;
        this.w = maxX - minX;
        this.h = maxY - minY;

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

    clone() {
        return new BoundingRect(this.x, this.y, this.w, this.h);
    }
}