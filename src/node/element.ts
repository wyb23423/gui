import { TransformMatrix } from "../core/transform_matrix";

export interface Canvas2DElement {
    type: string;
    transform: TransformMatrix;
    isVisible: boolean;
    id?: string;
    isStatic?: boolean;
}