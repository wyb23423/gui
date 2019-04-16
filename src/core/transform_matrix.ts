import { Matrix, mul } from "../lib/matrix";

export class TransformMatrix extends Matrix {
    transform(m: TransformMatrix){
        [
            [this.a, this.c, this.e],
            [this.b, this.d, this.f]
        ] = mul(m.toArray(), this.toArray());

        return this;
    }
}