export const raf = (typeof window !== 'undefined' && window.requestAnimationFrame)
    ? window.requestAnimationFrame.bind(window)
    : (typeof self !== 'undefined' && (self as any).requestAnimationFrame)
        ? (self as any).requestAnimationFrame.bind(self)
        : (cb: FrameRequestCallback) => setTimeout(cb, 16);

export const caf = (typeof window !== 'undefined' && window.cancelAnimationFrame)
    ? window.cancelAnimationFrame.bind(window)
    : (typeof self !== 'undefined' && (self as any).cancelAnimationFrame)
        ? (self as any).cancelAnimationFrame.bind(self)
        : (id: number) => clearTimeout(id);
