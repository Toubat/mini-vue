'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ShapeFlag;
(function (ShapeFlag) {
    ShapeFlag[ShapeFlag["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlag[ShapeFlag["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlag[ShapeFlag["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlag[ShapeFlag["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
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
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

let targetMap = new WeakMap();
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

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // TODO: attrs
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
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

function createComponentInstance(vnode) {
    const instance = {
        type: vnode.type,
        vnode,
        setupState: {},
        props: {},
        el: null,
        proxy: null,
    };
    return instance;
}
function setupComponent(instance) {
    // TODO: initProps()
    initProps(instance, instance.vnode.props);
    // TODO: initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // Return function or object
        const setupResult = setup(shallowRaedonly(instance.props));
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

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // ShapeFlags
    const { shapeFlag } = vnode;
    // Check if vnode is of element type
    if (shapeFlag & ShapeFlag.ELEMENT) {
        // process element
        processElement(vnode, container);
    }
    else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
        // STATEFUL_COMPONENT
        // process component
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, children, shapeFlag } = vnode;
    // @ts-ignore
    const el = (vnode.el = document.createElement(type));
    // String/Array
    if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
        // @ts-ignore
        el.textContent = children;
    }
    else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
        // @ts-ignore
        moundChildren(children, el);
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
function mountComponent(initialVNode, container) {
    // Create component instance
    const instance = createComponentInstance(initialVNode);
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
    patch(subTree, container);
    // After element mounted
    instance.vnode.el = subTree.el;
}
function moundChildren(children, container) {
    children.forEach((child) => {
        patch(child, container);
    });
}

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
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? ShapeFlag.ELEMENT : ShapeFlag.STATEFUL_COMPONENT;
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

exports.createApp = createApp;
exports.h = h;
