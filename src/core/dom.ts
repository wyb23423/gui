/**
 * dom操作
 */

let id: number = 0;
function createId(){
    return id++;
}

/**
 * 创建canvas
 * @param w
 * @param h
 */
export function createCanvas(w: number, h: number, id?: string){
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${w}px`,
        height: `${h}px`
    })

    canvas.setAttribute('data-dom-id', id || `canvas-${createId()}`);
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;

    return canvas;
}