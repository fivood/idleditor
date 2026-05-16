declare module 'dexie' {
  export type EntityTable<T, Key extends keyof T> = {
    get(key: T[Key]): Promise<T | undefined>
    put(value: T): Promise<unknown>
    update(key: T[Key], changes: Partial<T>): Promise<number>
    delete(key: T[Key]): Promise<void>
    orderBy(index: keyof T): {
      reverse(): { toArray(): Promise<T[]> }
    }
    where(index: keyof T): {
      equals(value: T[keyof T]): { count(): Promise<number> }
    }
  }

  export default class Dexie {
    constructor(name: string)
    delete(): Promise<void>
    version(versionNumber: number): {
      stores(schema: Record<string, string>): void
    }
  }
}
