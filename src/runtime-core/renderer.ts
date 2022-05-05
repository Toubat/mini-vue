import { effect } from '../reactivity/effect';
import { EMPTY_OBJ, getSequenceIndices, isSameVNodeType } from '../shared';
import { ShapeFlag } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent, Component, ComponentInstance } from './component';
import { shouldUpdateComponent } from './componentUpdateUtils';
import { createAppAPI } from './createApp';
import { queueJobs } from './scheduler';
import { createTextVNode, Fragment, Text, VNode } from './vnode';

export interface RendererOptions {
  createElement: (type: string) => any;
  patchProps: (el: HTMLElement, key: string, prevVal: any, nextVal: any) => void;
  insert: (el: HTMLElement, container: HTMLElement, anchor: HTMLElement | null) => void;
  remove: (el: HTMLElement | Text) => void;
  setElementText: (el: HTMLElement, text: string) => void;
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProps: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode: VNode, container: HTMLElement) {
    // patch
    patch(null, vnode, container, null, null);
  }

  function patch(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    // ShapeFlags
    const { shapeFlag, type } = currNode;

    // Fragment -> only render children
    switch (type) {
      case Fragment:
        processFragment(prevNode, currNode, container, parentInstance, anchor);
        break;
      case Text:
        processText(prevNode, currNode, container);
      default:
        // Check if vnode is of element type or component type
        if (shapeFlag & ShapeFlag.ELEMENT) {
          // process element
          processElement(prevNode, currNode, container, parentInstance, anchor);
        } else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
          // process component
          processComponent(prevNode, currNode, container, parentInstance, anchor);
        }
    }
  }

  function processFragment(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    const { children } = currNode;

    mountChildren(children as VNode[], container, parentInstance, null);
  }

  function processText(prevNode: VNode | null, currNode: VNode, container: HTMLElement) {
    const { children } = currNode;

    const textNode = (currNode.el = document.createTextNode(children as string));
    container.append(textNode);
  }

  function processElement(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    if (!prevNode) {
      mountElement(currNode, container, parentInstance, anchor);
    } else {
      patchElement(prevNode, currNode, container, parentInstance, anchor);
    }
  }

  function patchElement(
    prevNode: VNode,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    const oldProps = prevNode.props || EMPTY_OBJ;
    const newProps = currNode.props || EMPTY_OBJ;

    const el = (currNode.el = prevNode.el) as HTMLElement;

    // patch children
    patchChildren(prevNode, currNode, el, parentInstance, anchor);
    // patch props
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(
    prevNode: VNode,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    const { shapeFlag, children } = currNode;
    const { shapeFlag: prevShapeFlag, children: prevChildren } = prevNode;

    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      // Array -> Text
      if (prevShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
        // Remove children
        unmountChildren(prevNode.children);
      }
      // Update text content
      if (prevChildren !== children) {
        hostSetElementText(container, children as string);
      }
    } else {
      if (prevShapeFlag & ShapeFlag.TEXT_CHILDREN) {
        hostSetElementText(container, '');
        mountChildren(children as VNode[], container, parentInstance, null);
      } else {
        // Array -> Array
        patchKeyedChildren(
          prevChildren as VNode[],
          children as VNode[],
          container,
          parentInstance,
          anchor
        );
      }
    }
  }

  function patchKeyedChildren(
    prevChildren: VNode[],
    currChildren: VNode[],
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    parentAnchor: HTMLElement | null
  ) {
    let i = 0;
    const prevLength = prevChildren.length;
    const currLength = currChildren.length;
    let prevEnd = prevLength - 1;
    let currEnd = currLength - 1;

    // Iterate from left to right, break at the first time prevNode differs from currNode
    //  A   B   C
    //  A   B   D   E
    //          |       i
    while (i <= prevEnd && i <= currEnd) {
      const prevNode = prevChildren[i];
      const currNode = currChildren[i];

      if (isSameVNodeType(prevNode, currNode)) {
        patch(prevNode, currNode, container, parentInstance, parentAnchor);
      } else {
        break;
      }

      i++;
    }

    // Iterate from right to left, break at the first time prevNode differs from currNode
    //      A   B   C
    //  A   B   D   C
    //          |      e1, e2
    while (i <= prevEnd && i <= currEnd) {
      const prevNode = prevChildren[prevEnd];
      const currNode = currChildren[currEnd];

      if (isSameVNodeType(prevNode, currNode)) {
        patch(prevNode, currNode, container, parentInstance, parentAnchor);
      } else {
        break;
      }

      prevEnd--;
      currEnd--;
    }

    if (i > prevEnd) {
      // New element append to new children
      //  A   B
      //  A   B   C   D
      //          |       i
      //      |           e1
      //              |   e2
      // New element prepend to new children
      //   A   B
      //   C   D   A   B
      //   |              i
      // |                e1
      //       |          e2
      const nextPos = currEnd + 1;
      const anchor = nextPos < currLength ? currChildren[nextPos].el : null;
      while (i <= currEnd) {
        patch(null, currChildren[i++], container, parentInstance, anchor as any);
      }
    } else if (i > currEnd) {
      // Old element popped from new children
      //  A   B   C   D
      //  A   B
      //          |       i
      //              |   e1
      //      |           e2
      // Old element shifted to new children
      //   C   D   A   B
      //   A   B
      //   |              i
      //       |          e1
      // |                e2
      while (i <= prevEnd) {
        hostRemove(prevChildren[i++].el as any);
      }
    } else {
      let s1 = i;
      let s2 = i;
      let patched = 0;
      let moved = false;
      let maxNewIndexSoFar = 0;

      const toBePatched = currEnd - s2 + 1;
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched).fill(-1);

      // Create key to new index mapping
      for (let i = s2; i <= currEnd; i++) {
        const key = currChildren[i].key;
        if (key != null) keyToNewIndexMap.set(key, i);
      }

      // Iterate over old children to find their new index based on key,
      // if new index not found, node should be removed
      // otherwise, recursively patch node
      for (let i = s1; i <= prevEnd; i++) {
        const prevNode = prevChildren[i];

        // Optimization: if patched elements has reached the maximum,
        // remove all nodes after it
        if (patched >= toBePatched) {
          hostRemove(prevNode.el as any);
          continue;
        }

        let newIndex; // index of prevNode in newChildren array
        if (prevNode.key !== null) {
          newIndex = keyToNewIndexMap.get(prevNode.key);
        } else {
          for (let j = s2; j <= currEnd; j++) {
            if (isSameVNodeType(prevNode, currChildren[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex === undefined) {
          hostRemove(prevNode.el as any);
        } else {
          // Optimization: check if new indices is a strictly incrementing sequence
          // If so, no need to run longest increasing subsequence algorithm
          if (newIndex > maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          // A  B  (C  D  E)  F
          // A  B  (E  C  D)  F
          // Want: [4, 2, 3]
          newIndexToOldIndexMap[newIndex - s2] = i;
          patch(prevNode, currChildren[newIndex], container, parentInstance, null);
          patched++;
        }
      }

      // Reorder existing nodes to new indices
      const increasingNewIdxSequence = moved ? getSequenceIndices(newIndexToOldIndexMap) : [];
      let j = increasingNewIdxSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        const currIndex = i + s2;
        const currChild = currChildren[currIndex];
        const anchor: any = currIndex + 1 < currLength ? currChildren[currIndex + 1].el : null;

        // Create new nodes
        if (newIndexToOldIndexMap[i] === -1) {
          // -1 means new node, so we create a new one
          patch(null, currChild, container, parentInstance, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIdxSequence[j]) {
            hostInsert(currChild.el as any, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function patchProps(el: HTMLElement, oldProps, newProps) {
    // Optimization ??
    if (oldProps === newProps) return;

    // Add or modify existing prop
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];

      if (prevProp !== nextProp) {
        hostPatchProps(el, key, prevProp, nextProp);
      }
    }

    if (oldProps === EMPTY_OBJ) return;

    // Remove old prop
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProps(el, key, oldProps[key], null);
      }
    }
  }

  function processComponent(
    prevNode: VNode | null,
    currNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    if (!prevNode) {
      mountComponent(currNode, container, parentInstance, anchor);
    } else {
      updateComponent(prevNode, currNode);
    }
  }

  function updateComponent(prevNode: VNode, currNode: VNode) {
    const instance = (currNode.instance = prevNode.instance as ComponentInstance);
    if (shouldUpdateComponent(prevNode, currNode)) {
      instance.next = currNode;

      instance.update();
    } else {
      currNode.el = prevNode.el;
      instance.vnode = currNode;
    }
  }

  function mountElement(
    vnode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    const { type, props, children, shapeFlag } = vnode;

    // debugger;
    // @ts-ignore
    const el: HTMLElement = (vnode.el = hostCreateElement(type));

    // String/Array
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
      el.textContent = children as string;
    } else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
      mountChildren(children as VNode[], el, parentInstance, null);
    }

    for (const key in props) {
      const val = props[key];
      hostPatchProps(el, key, null, val);
    }

    // container.append(el);
    hostInsert(el, container, anchor);
  }

  function mountComponent(
    initialVNode: VNode,
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    // Create component instance
    const instance = (initialVNode.instance = createComponentInstance(
      initialVNode,
      parentInstance
    ));

    setupComponent(instance);
    setupRenderEffect(instance, container, anchor);
  }

  function setupRenderEffect(instance: ComponentInstance, container, anchor: HTMLElement | null) {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          const { proxy } = instance;

          if (!instance.render) return;
          const subTree = (instance.subTree = instance.render.call(proxy, proxy));

          // vnode -> patch
          patch(null, subTree, container, instance, anchor);

          // After element mounted
          instance.vnode.el = subTree.el;

          instance.isMounted = true;
        } else {
          console.log('Update');
          // Update: el, props, subTree, vnode
          const { proxy, subTree: prevSubTree, next, vnode } = instance;

          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }

          if (!instance.render) return;
          const subTree = (instance.subTree = instance.render.call(proxy, proxy));

          patch(prevSubTree, subTree, container, instance, anchor);
          // instance.vnode.el = subTree.el;
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
  }

  function updateComponentPreRender(instance: ComponentInstance, nextVNode: VNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    // Update props
    instance.props = nextVNode.props;
  }

  function mountChildren(
    children: VNode[],
    container: HTMLElement,
    parentInstance: ComponentInstance | null,
    anchor: HTMLElement | null
  ) {
    children.forEach((child) => {
      if (typeof child === 'string') {
        patch(null, createTextVNode(child), container, parentInstance, anchor);
      } else {
        patch(null, child, container, parentInstance, anchor);
      }
    });
  }

  function unmountChildren(children: VNode[] | string | undefined) {
    if (!Array.isArray(children)) return;

    children.forEach((child, i) => {
      // Remove
      const el = child.el;
      if (el) hostRemove(el);
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
