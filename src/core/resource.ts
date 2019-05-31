/**
 * 资源管理，主要是图片
 */

interface ResData {
    image: HTMLImageElement,
    count: number
}

const res: Map<string, ResData> = new Map();

/**
 * 获取图片
 * @param isFirst 是否是节点第一次请求图片
 */
export function getImg(path: string, isFirst: boolean = true): Promise<HTMLImageElement> {
    const data = res.get(path);
    if (data) {
        if (isFirst) {
            data.count++;
        }

        return Promise.resolve(data.image);
    }

    const img = new Image();
    img.src = path;

    return new Promise(resolve => {
        img.onload = () => {
            res.set(path, { image: img, count: 1 });
            resolve(img);
        }

        img.onerror = (e) => {
            console.error(e);
        }
    });
}

/**
 * 释放图片
 */
export function disposeImg(path: string) {
    const data = res.get(path);

    if (data) {
        data.count--;
        if (data.count <= 0) {
            data.image.onload = null;
            res.delete(path);
        }
    }
}