import { Engine } from "./engine";
import { Input } from "./node/input";


// export { Layer } from "./layer";
// export { Engine } from "./engine";
// export { Canvas2DElement } from "./node/element";
// export { Container } from "./node/container";
// export { Canvas2DImage } from "./node/image";
// export { TextBlock } from "./node/text";
// export { Canvas2DAnimation } from './animation/animation';
// export { Stack } from "./node/stack";
// export { Scroll } from "./node/scroll";

const root = document.createElement('div');
root.style.width = '100%';
root.style.height = '500px';
root.style.margin = '0 auto';
root.style.border = '1px solid #ccc';

document.body.appendChild(root);

const engine = new Engine(root);
engine.addLayer(0).render();

const layer0 = engine.getLayer(0);

const input = new Input(0).attr({
    width: '50%',
    height: 30
});
layer0.add(input);