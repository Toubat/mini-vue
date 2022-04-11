const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isElement = (vnode) => {
    return typeof vnode.type === 'string';
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get(instance, key) {
        // setupState
        const { setupState } = instance;
        if (key in setupState) {
            return Reflect.get(setupState, key);
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
        el: null,
        proxy: null,
    };
    return instance;
}
function setupComponent(instance) {
    // TODO: initProps()
    // TODO: initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // Return function or object
        const setupResult = setup();
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
    // Check if vnode is of element type
    if (isElement(vnode)) {
        // process element
        processElement(vnode, container);
    }
    else if (isObject(vnode)) {
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
    const { type, props, children } = vnode;
    // @ts-ignore
    const el = (vnode.el = document.createElement(type));
    // String/Array
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        moundChildren(children, el);
    }
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
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

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
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

export { createApp, h };
