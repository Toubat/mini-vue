import { VNode } from '../runtime-core/vnode';

export const EMPTY_OBJ = {};

export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

export const isElement = (vnode: VNode) => {
  return typeof vnode.type === 'string';
};

export const hasChanged = (value, newValue) => {
  return !Object.is(value, newValue);
};

export const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toEventHandlerKey = (event: string): string => {
  return event ? 'on' + capitalize(camelize(event)) : '';
};

export const camelize = (str: string): string => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : '';
  });
};

export const isSameVNodeType = (node1: VNode, node2: VNode) => {
  return node1.type === node2.type && node1.key === node2.key;
};

/**
 * Given a list of number, get the list of indices representing LIS
 * @param nums list of number
 */
export const getSequenceIndices = (nums: number[]): number[] => {
  let idx = 0;
  const indices: number[] = [];
  const LIS = new Array(nums.length).fill(1); // length of LIS ending with element i
  const prev = new Array(nums.length).fill(-1); // index of the previous number in LIS ending with element i

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i] && LIS[i] < LIS[j] + 1) {
        LIS[i] = LIS[j] + 1;
        prev[i] = j;
      }
    }
    if (LIS[idx] < LIS[i]) {
      idx = i;
    }
  }

  while (idx !== -1) {
    indices.push(idx);
    idx = prev[idx];
  }

  indices.reverse();
  return indices;
};
