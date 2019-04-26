export { Canvas2DElement } from "./node/element";
export { Layer } from "./layer";
export { Engine } from "./engine";
export { Container } from "./node/container";
export { Canvas2DImage } from "./node/image";
export { TextBlock } from "./node/text";
export { Canvas2DAnimation } from './animation/animation';

import { Engine } from "./engine";
import { Container } from "./node/container";
import { Canvas2DImage } from "./node/image";
import { Canvas2DAnimation } from "./animation/animation";

const root = document.createElement('div');
root.style.width = '100%';
root.style.height = '500px';
root.style.margin = '0 auto';
root.style.border = '1px solid #ccc';

document.body.appendChild(root);

const engine = new Engine(root);
engine
    .addLayer(0)
    .addLayer(1);

const layer0 = engine.getLayer(0);
const layer1 = engine.getLayer(1);

const controls = new Array(10).fill(0).map((v, i) => new Container(i));
controls[0].attr({
    width: 200,
    height: 100,
    background: '#e00',
    rotation: Math.PI / 4,
    // opacity: 0.6,
    scale: 1.2,
    border: 10,
    borderColor: '#ccc',
    // origin: [0, 0],
    // clip: true
});
controls[1].attr({
    width: 20,
    height: 20,
    // border: 2,
    background: '#9ff',
    // borderRadius: 0.5
});
controls[2].attr({
    width: '50%',
    height: '50%',
    left: 0,
    top: 0,
    // origin: [0, 0],
    background: '#6cf',
    // opacity: 0.5,
    border: 10,
    borderColor: '#99f',
    rotation: Math.PI / 3,
    scale: 2,
    // clip: true
});
const img = new Canvas2DImage(11);
img.attr({
    src: require('./assets/1.jpg'),
    width: 102.4,
    height: 64,
    rotation: -Math.PI * 7 / 12
});

controls[0].add(controls[2].add(img));

layer0.add(controls[0]);
engine.render();

const animation = new Canvas2DAnimation(1000, Infinity);
animation.addFrame(1, {height: '100%'});
animation.setElement(controls[2]);

console.log(animation);
animation.start();

root.addEventListener('click', event => {
    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    console.log(layer0.getTarget(x, y));
})