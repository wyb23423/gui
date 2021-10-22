let lastFrameTime = 0;

// 模拟 requestAnimationFrame
export function doAnimationFrame(callback: (time: number) => void) {
  const currTime = new Date().getTime();
  const timeToCall = Math.max(0, 16 - (currTime - lastFrameTime));
  // eslint-disable-next-line node/no-callback-literal
  const id: unknown = setTimeout(() => callback(currTime + timeToCall), timeToCall);
  lastFrameTime = currTime + timeToCall;

  return id as number;
}

// 模拟 cancelAnimationFrame
export function abortAnimationFrame(id: number) {
  clearTimeout(id);
}
