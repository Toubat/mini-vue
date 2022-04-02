const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isElement = (vnode) => {
    return typeof vnode.type === 'string';
};

function createComponentInstance(vnode) {
    const component = {
        type: vnode.type,
        vnode,
    };
    return component;
}
function setupComponent(instance) {
    // TODO: initProps()
    // TODO: initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
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
    debugger;
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
    const el = document.createElement(type);
    // String/Array
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        moundChildren(vnode, el);
    }
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
}
function mountComponent(vnode, container) {
    // Create component instance
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
}
function moundChildren(vnode, container) {
    vnode.children.forEach((child) => {
        patch(child, container);
    });
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
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
