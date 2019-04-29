

export { Layer } from "./layer";
export { Engine } from "./engine";
export { Canvas2DElement } from "./node/element";
export { Container } from "./node/container";
export { Canvas2DImage } from "./node/image";
export { TextBlock } from "./node/text";
export { Canvas2DAnimation } from './animation/animation';
export { Stack } from "./node/stack";
export { Scroll } from "./node/scroll";

import { TextBlock } from "./node/text";
import { Engine } from "./engine";


const root = document.createElement('div');
root.style.width = '100%';
root.style.height = '500px';
root.style.margin = '0 auto';
root.style.border = '1px solid #ccc';

document.body.appendChild(root);

const engine = new Engine(root);
const layer0 = engine.addLayer(0).getLayer(0);

const text = new TextBlock(0).setTextStyle({
    text: '[HMR] Waiting for update signal from WDS... client:85 [WDS] Hot Module Replacement enabled.'.repeat(10),
    letterSpacing: 2,
    lineHeight: 16,
    indent: 24
}).attr({
    width: '96%',
    left: '2%'
});
text.event.on('click', function(...arg: any[]){
    console.log(this, arg);
});

layer0.add(text);
engine.render();