/**
 * 2维向量
 */
import { Matrix, mul } from "./matrix";

export class Vector2 {
    constructor(public x: number = 0, public y: number = x) { }

    /**
     * 使用x及y的最小值创建2维向量
     */
    static createMin(x: number[] | number, y: number[] | number) {
        if(!Array.isArray(x)) {
            x = [x];
        }
        if(!Array.isArray(y)) {
            y = [y];
        }

        return new Vector2(Math.min.apply(Math, x), Math.min.apply(Math, y));
    }

    /**
     * 使用x及y的最大值创建2维向量
     */
    static createMax(x: number[] | number, y: number[] | number) {
        if(!Array.isArray(x)) {
            x = [x];
        }
        if(!Array.isArray(y)) {
            y = [y];
        }

        return new Vector2(Math.max.apply(Math, x), Math.max.apply(Math, y));
    }

    /**
     * 使用2维数组创建向量
     */
    static of(data: number[][]){
        return new Vector2(data[0][0], data[1][0]);
    }

    toMin(v: Vector2){
        this.x = Math.min(v.x, this.x);
        this.y = Math.min(v.y, this.y);

        return this;
    }

    toMax(v: Vector2){
        this.x = Math.max(v.x, this.x);
        this.y = Math.max(v.y, this.y);

        return this;
    }

    toArray(){
        return [
            [this.x],
            [this.y],
            [1]
        ];
    }

    /** 向量变换, 右乘矩阵 */
    transform(m: Matrix){
        const vector = mul(m.toArray(), this.toArray());
        this.x = vector[0][0];
        this.y = vector[1][1];

        return this;
    }
}