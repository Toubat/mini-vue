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
    triggerEffects(dep);
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
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        el: null,
        proxy: null,
        parent: parent,
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
        instance.setupState = setupResult;
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

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props = {}, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
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

function render(vnode, container) {
    // patch
    patch(vnode, container, null);
}
function patch(vnode, container, parentInstance) {
    // ShapeFlags
    const { shapeFlag, type } = vnode;
    // Fragment -> only render children
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentInstance);
            break;
        case Text:
            processText(vnode, container);
        default:
            // Check if vnode is of element type or component type
            if (shapeFlag & ShapeFlag.ELEMENT) {
                // process element
                processElement(vnode, container, parentInstance);
            }
            else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
                // process component
                processComponent(vnode, container, parentInstance);
            }
    }
}
function processFragment(vnode, container, parentInstance) {
    const { children } = vnode;
    mountChildren(children, container, parentInstance);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processElement(vnode, container, parentInstance) {
    mountElement(vnode, container, parentInstance);
}
function processComponent(vnode, container, parentInstance) {
    mountComponent(vnode, container, parentInstance);
}
function mountElement(vnode, container, parentInstance) {
    const { type, props, children, shapeFlag } = vnode;
    // @ts-ignore
    const el = (vnode.el = document.createElement(type));
    // String/Array
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
        el.textContent = children;
    }
    else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
        mountChildren(children, el, parentInstance);
    }
    for (const key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountComponent(initialVNode, container, parentInstance) {
    // Create component instance
    const instance = createComponentInstance(initialVNode, parentInstance);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const { proxy } = instance;
    if (!instance.render)
        return;
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container, instance);
    // After element mounted
    instance.vnode.el = subTree.el;
}
function mountChildren(children, container, parentInstance) {
    children.forEach((child) => {
        if (typeof child === 'string') {
            patch(createTextVNode(child), container, parentInstance);
        }
        else {
            patch(child, container, parentInstance);
        }
    });
}

function createApp(rootComponent) {
    return {
        mount(rootSelector) {
            // Convert to VNode
            // component -> VNode
            const vnode = createVNode(rootComponent);
            const rootContainer = document.querySelector(rootSelector);
            render(vnode, rootContainer);
        },
    };
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

export { computed, createApp, createTextVNode, getCurrentInstance, h, inject, provide, reactive, ref, renderSlots };
