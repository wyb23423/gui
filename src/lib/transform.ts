import { Matrix } from "./matrix";

export class Transform {
    transform(m: Matrix | number[][]){}

    rotate(rotation: number){
        if(rotation) {
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            this.transform(
                [
                    [cos, -sin, 0],
                    [sin, cos, 0],
                    [0, 0, 1]
                ]
            );
        }

        return this;
    }

    scale(sx: number | number[] = 1, sy: number = 1){
        if(Array.isArray(sx)){
            sy = sx[1];
            sx = sx[0];
        }

        if(sx !== 1 || sy !== 1){
            this.transform([
                [sx, 0, 0],
                [0, sy, 0],
                [0, 0, 1]
            ]);
        }

        return this;
    }

    translate(x: number | number[] = 0, y: number = 0){
        if(Array.isArray(x)){
            y = x[1];
            x = x[0];
        }

        if(x || y){
            this.transform([
                [1, 0, x],
                [0, 1, y],
                [0, 0, 1]
            ]);
        }

        return this;
    }
}