var ShapeFlag;
(function (ShapeFlag) {
    ShapeFlag[ShapeFlag["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlag[ShapeFlag["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlag[ShapeFlag["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlag[ShapeFlag["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlag[ShapeFlag["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(ShapeFlag || (ShapeFlag = {}));
// 1. Can set  or modify type
// ShapeFlags.element = 1;
// ShapeFlags.stateful_component = 1;
// 2. Can check type
// if (ShapeFlags.element)
// if (ShapeFlags.stateful_component)
// Bitwise operation
// 0000
// 0001 -> element
// 0010 -> stateful_component
// 0100 -> text_children
// 1000 -> array_childern
// Modify

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props = {}, children) {
    const vnode = {
        key: (props && props.key) || null,
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
        instance: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.TEXT_CHILDREN;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.ARRAY_CHILDREN;
    }
    else if (vnode.shapeFlag & ShapeFlag.STATEFUL_COMPONENT && typeof children === 'object') {
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlag.SLOT_CHILDREN;
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string' ? ShapeFlag.ELEMENT : ShapeFlag.STATEFUL_COMPONENT;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            // Create a vnode
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const EMPTY_OBJ = {};
const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const hasChanged = (value, newValue) => {
    return !Object.is(value, newValue);
};
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toEventHandlerKey = (event) => {
    return event ? 'on' + capitalize(camelize(event)) : '';
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const isSameVNodeType = (node1, node2) => {
    return node1.type === node2.type && node1.key === node2.key;
};
/**
 * Given a list of number, get the list of indices representing LIS
 * @param nums list of number
 */
const getSequenceIndices = (nums) => {
    let idx = 0;
    const indices = [];
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

// Global variables
let activeEffect;
let targetMap = new WeakMap();
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        activeEffect = undefined;
        return res;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    // Options
    extend(_effect, options);
    // bind "this" pointer to _effect
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function track(target, key) {
    if (!isTracking())
        return;
    // Create a depdendencies map target -> key
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // Create a dependency map key -> effect
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // No need to add existing dependency
    if (dep.has(activeEffect))
        return;
    // Add effect to the dependency map
    dep.add(activeEffect);
    // Effect reverse mapping
    if (activeEffect) {
        activeEffect.deps.push(dep);
    }
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    if (dep !== undefined) {
        triggerEffects(dep);
    }
}
function triggerEffects(dep) {
    dep.forEach((effect) => {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // Reset deps
    effect.deps.length = 0;
}

// cache the getter and setter so it will only be called once
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowRaedonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // check to see whether isReactive or isReadonly is called
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key == "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // if shalow readonly, simply return the value
        if (shallow) {
            return res;
        }
        // Allow nested object to be reactive/readonly
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // Track dependency
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // Trigger effect
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} cannot be set, since target is readonly.`, target);
        return true;
    },
};
const shalowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowRaedonlyGet,
});

function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
function shallowRaedonly(target) {
    return createReactiveObject(target, shalowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be an object`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        // Check if value is object; if so, make it to reactive
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // No trigger effect if the value did not change
        if (hasChanged(newValue, this._rawValue)) {
            // Make sure to set value before triggering effects
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerEffects(this.dep);
        }
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(value) {
    return !!value.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            const res = Reflect.get(target, key);
            if (isRef(res) && !isRef(value)) {
                return (res.value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}

class ComputedImpl {
    constructor(getter) {
        this._dirty = true; // indicate whether dependency has changed
        this._getter = getter;
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
            }
        });
    }
    get value() {
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedImpl(getter);
}

function emit(instance, event, ...args) {
    // instance.props -> event
    const { props } = instance;
    const handlerName = toEventHandlerKey(event);
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // TODO: attrs
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get(instance, key) {
        // setupState
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return Reflect.get(setupState, key);
        }
        else if (hasOwn(props, key)) {
            return Reflect.get(props, key);
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlag.SLOT_CHILDREN) {
        // children -> object
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    console.log('parent: ', parent);
    const instance = {
        type: vnode.type,
        vnode,
        next: null,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        el: null,
        proxy: null,
        parent: parent,
        isMounted: false,
        subTree: null,
        update: () => null,
        emit: () => { },
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    // initProps
    initProps(instance, instance.vnode.props);
    // initSlots
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // set global currentInstance variable to be used in setup()
        setCurrentInstance(instance);
        // Return function or object
        const setupResult = setup(shallowRaedonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO: function
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (!instance.render) {
        instance.render = Component.render;
    }
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    var _a;
    // store
    const currentInstance = getCurrentInstance();
    if (!currentInstance) {
        console.warn('[provide] should be called in setup()');
        return;
    }
    let { provides } = currentInstance;
    const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
    // init - only run once
    if (provides === parentProvides) {
        // point the prototype of currentInstance provider to parent instance provider
        provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
}
function inject(key, defaultValue) {
    // access
    const currentInstance = getCurrentInstance();
    if (!currentInstance) {
        console.warn('[inject] should be called in setup()');
        return;
    }
    const { parent } = currentInstance;
    const parentProvides = parent === null || parent === void 0 ? void 0 : parent.provides;
    if (key in parentProvides)
        return parentProvides[key];
    if (defaultValue) {
        if (typeof defaultValue === 'function')
            return defaultValue();
        return defaultValue;
    }
}

function shouldUpdateComponent(prevNode, currNode) {
    const { props: prevProps } = prevNode;
    const { props: currProps } = currNode;
    for (const key in currProps) {
        if (currProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootSelector) {
                // Convert to VNode
                // component -> VNode
                const vnode = createVNode(rootComponent);
                const rootContainer = typeof rootSelector === 'string' ? document.querySelector(rootSelector) : rootSelector;
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // patch
        patch(null, vnode, container, null, null);
    }
    function patch(prevNode, currNode, container, parentInstance, anchor) {
        // ShapeFlags
        const { shapeFlag, type } = currNode;
        // Fragment -> only render children
        switch (type) {
            case Fragment:
                processFragment(prevNode, currNode, container, parentInstance);
                break;
            case Text:
                processText(prevNode, currNode, container);
            default:
                // Check if vnode is of element type or component type
                if (shapeFlag & ShapeFlag.ELEMENT) {
                    // process element
                    processElement(prevNode, currNode, container, parentInstance, anchor);
                }
                else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
                    // process component
                    processComponent(prevNode, currNode, container, parentInstance, anchor);
                }
        }
    }
    function processFragment(prevNode, currNode, container, parentInstance, anchor) {
        const { children } = currNode;
        mountChildren(children, container, parentInstance, null);
    }
    function processText(prevNode, currNode, container) {
        const { children } = currNode;
        const textNode = (currNode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(prevNode, currNode, container, parentInstance, anchor) {
        if (!prevNode) {
            mountElement(currNode, container, parentInstance, anchor);
        }
        else {
            patchElement(prevNode, currNode, container, parentInstance, anchor);
        }
    }
    function patchElement(prevNode, currNode, container, parentInstance, anchor) {
        const oldProps = prevNode.props || EMPTY_OBJ;
        const newProps = currNode.props || EMPTY_OBJ;
        const el = (currNode.el = prevNode.el);
        // patch children
        patchChildren(prevNode, currNode, el, parentInstance, anchor);
        // patch props
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(prevNode, currNode, container, parentInstance, anchor) {
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
                hostSetElementText(container, children);
            }
        }
        else {
            if (prevShapeFlag & ShapeFlag.TEXT_CHILDREN) {
                hostSetElementText(container, '');
                mountChildren(children, container, parentInstance, null);
            }
            else {
                // Array -> Array
                patchKeyedChildren(prevChildren, children, container, parentInstance, anchor);
            }
        }
    }
    function patchKeyedChildren(prevChildren, currChildren, container, parentInstance, parentAnchor) {
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
            }
            else {
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
            }
            else {
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
                patch(null, currChildren[i++], container, parentInstance, anchor);
            }
        }
        else if (i > currEnd) {
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
                hostRemove(prevChildren[i++].el);
            }
        }
        else {
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
                if (key != null)
                    keyToNewIndexMap.set(key, i);
            }
            // Iterate over old children to find their new index based on key,
            // if new index not found, node should be removed
            // otherwise, recursively patch node
            for (let i = s1; i <= prevEnd; i++) {
                const prevNode = prevChildren[i];
                // Optimization: if patched elements has reached the maximum,
                // remove all nodes after it
                if (patched >= toBePatched) {
                    hostRemove(prevNode.el);
                    continue;
                }
                let newIndex; // index of prevNode in newChildren array
                if (prevNode.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevNode.key);
                }
                else {
                    for (let j = s2; j <= currEnd; j++) {
                        if (isSameVNodeType(prevNode, currChildren[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevNode.el);
                }
                else {
                    // Optimization: check if new indices is a strictly incrementing sequence
                    // If so, no need to run longest increasing subsequence algorithm
                    if (newIndex > maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
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
                const anchor = currIndex + 1 < currLength ? currChildren[currIndex + 1].el : null;
                // Create new nodes
                if (newIndexToOldIndexMap[i] === -1) {
                    // -1 means new node, so we create a new one
                    patch(null, currChild, container, parentInstance, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIdxSequence[j]) {
                        hostInsert(currChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function patchProps(el, oldProps, newProps) {
        // Optimization ??
        if (oldProps === newProps)
            return;
        // Add or modify existing prop
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                hostPatchProps(el, key, prevProp, nextProp);
            }
        }
        if (oldProps === EMPTY_OBJ)
            return;
        // Remove old prop
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProps(el, key, oldProps[key], null);
            }
        }
    }
    function processComponent(prevNode, currNode, container, parentInstance, anchor) {
        if (!prevNode) {
            mountComponent(currNode, container, parentInstance, anchor);
        }
        else {
            updateComponent(prevNode, currNode);
        }
    }
    function updateComponent(prevNode, currNode) {
        const instance = (currNode.instance = prevNode.instance);
        if (shouldUpdateComponent(prevNode, currNode)) {
            instance.next = currNode;
            instance.update();
        }
        else {
            currNode.el = prevNode.el;
            instance.vnode = currNode;
        }
    }
    function mountElement(vnode, container, parentInstance, anchor) {
        const { type, props, children, shapeFlag } = vnode;
        // debugger;
        // @ts-ignore
        const el = (vnode.el = hostCreateElement(type));
        // String/Array
        if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
            el.textContent = children;
        }
        else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
            mountChildren(children, el, parentInstance, null);
        }
        for (const key in props) {
            const val = props[key];
            hostPatchProps(el, key, null, val);
        }
        // container.append(el);
        hostInsert(el, container, anchor);
    }
    function mountComponent(initialVNode, container, parentInstance, anchor) {
        // Create component instance
        const instance = (initialVNode.instance = createComponentInstance(initialVNode, parentInstance));
        setupComponent(instance);
        setupRenderEffect(instance, container, anchor);
    }
    function setupRenderEffect(instance, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                if (!instance.render)
                    return;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode -> patch
                patch(null, subTree, container, instance, anchor);
                // After element mounted
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // Update: el, props, subTree, vnode
                const { proxy, subTree: prevSubTree, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                if (!instance.render)
                    return;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(prevSubTree, subTree, container, instance, anchor);
                // instance.vnode.el = subTree.el;
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        // Update props
        instance.props = nextVNode.props;
    }
    function mountChildren(children, container, parentInstance, anchor) {
        children.forEach((child) => {
            if (typeof child === 'string') {
                patch(null, createTextVNode(child), container, parentInstance, anchor);
            }
            else {
                patch(null, child, container, parentInstance, anchor);
            }
        });
    }
    function unmountChildren(children) {
        if (!Array.isArray(children))
            return;
        children.forEach((child, i) => {
            // Remove
            const el = child.el;
            if (el)
                hostRemove(el);
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container, anchor) {
    // container.appendChild(el);
    container.insertBefore(el, anchor || null);
}
function remove(el) {
    const parent = el.parentNode;
    if (parent)
        parent.removeChild(el);
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText,
});
function createApp(rootComponent) {
    return renderer.createApp(rootComponent);
}

export { computed, createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, reactive, ref, renderSlots };
