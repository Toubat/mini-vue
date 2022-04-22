import { syncedStore, enableVueBindings, Y, SyncedText } from '@syncedstore/core';
import { isReactive, reactive } from '../reactive';
import { effect } from '../effect';

describe('Synced Store', () => {
  it('should make nested data reactive', () => {
    enableVueBindings({ reactive });

    let str: string = '';

    const store = syncedStore({
      arr: [],
      object: {},
      todos: [],
      todosNotBoxed: [],
      myText: 'text',
    });

    const implicitStore = reactive(store);

    implicitStore.todosNotBoxed.push({
      text: 'title',
      completed: false,
    });

    effect(() => (str = implicitStore.todosNotBoxed[0].text));
    expect(str).toBe('title');

    implicitStore.todosNotBoxed[0].text = 'new title';
    expect(str).toBe('new title');
  });

  it('should make string reactive', () => {
    enableVueBindings({ reactive });

    let str;

    const store = syncedStore({ myText: 'text' });
    // store.myText.insert(0, 'Hello world');

    // const implicitStore = reactive(store);

    effect(() => (str = store.myText));
    // expect(str).toBe('Hello world text');

    // implicitStore.object.nested = 'new text';
    // expect(str).toBe('new text');

    // implicitStore.object.nested.insert(0, "I'm ");
    // expect(str).toBe("I'm new text");
  });
});
