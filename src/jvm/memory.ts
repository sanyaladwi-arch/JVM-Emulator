import { ConstantPoolEntry, HeapArray, HeapObject, JvmValue } from './types';

export class VirtualHeap {
  private arrays = new Map<number, HeapArray>();
  private objects = new Map<number, HeapObject>();
  private nextAddress = 0x1000;

  allocateIntArray(length: number): HeapArray {
    if (length < 0) {
      throw new Error(`NegativeArraySizeException: length ${length}`);
    }
    const address = this.nextAddress;
    this.nextAddress += Math.max(4, length * 4);
    const arrayInstance: HeapArray = {
      address,
      length,
      type: 'INT',
      elements: new Array(length).fill(0),
    };
    this.arrays.set(address, arrayInstance);
    return arrayInstance;
  }

  allocateObject(className: string): HeapObject {
    const address = this.nextAddress;
    this.nextAddress += 16;
    const obj: HeapObject = {
      address,
      className,
      fields: {},
    };
    this.objects.set(address, obj);
    return obj;
  }

  getArray(address: number): HeapArray {
    const arr = this.arrays.get(address);
    if (!arr) {
      throw new Error(`NullPointerException: Invalid array reference @0x${address.toString(16).toUpperCase()}`);
    }
    return arr;
  }

  getObject(address: number): HeapObject {
    const obj = this.objects.get(address);
    if (!obj) {
      throw new Error(`NullPointerException: Invalid object reference @0x${address.toString(16).toUpperCase()}`);
    }
    return obj;
  }

  getArraysSnapshot(): HeapArray[] {
    return Array.from(this.arrays.values()).map((a) => ({
      ...a,
      elements: [...a.elements],
    }));
  }

  getObjectsSnapshot(): HeapObject[] {
    return Array.from(this.objects.values()).map((o) => ({
      ...o,
      fields: { ...o.fields },
    }));
  }

  reset() {
    this.arrays.clear();
    this.objects.clear();
    this.nextAddress = 0x1000;
  }
}

export class RuntimeConstantPool {
  private entries: ConstantPoolEntry[] = [];

  constructor(initialEntries?: ConstantPoolEntry[]) {
    if (initialEntries) {
      this.entries = [...initialEntries];
    }
  }

  addUtf8(val: string): number {
    const idx = this.entries.length + 1;
    this.entries.push({ index: idx, tag: 'UTF8', value: val });
    return idx;
  }

  addInteger(val: number): number {
    const idx = this.entries.length + 1;
    this.entries.push({ index: idx, tag: 'INTEGER', value: val });
    return idx;
  }

  addClassRef(className: string): number {
    const idx = this.entries.length + 1;
    this.entries.push({ index: idx, tag: 'CLASS_REF', value: className });
    return idx;
  }

  addMethodRef(className: string, methodName: string, descriptor: string): number {
    const idx = this.entries.length + 1;
    this.entries.push({
      index: idx,
      tag: 'METHOD_REF',
      value: `${className}.${methodName}`,
      descriptor,
    });
    return idx;
  }

  getEntry(index: number): ConstantPoolEntry {
    const entry = this.entries.find((e) => e.index === index);
    if (!entry) {
      throw new Error(`ConstantPool entry #${index} not found (total: ${this.entries.length})`);
    }
    return entry;
  }

  getEntries(): ConstantPoolEntry[] {
    return [...this.entries];
  }
}
