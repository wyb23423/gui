// =======================================全局类型声明
declare global {
    type Nullable<T> = T | null | undefined;
}

// ====================================导出
export * from './core/path';