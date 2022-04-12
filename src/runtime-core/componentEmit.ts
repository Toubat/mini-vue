import { toEventHandlerKey } from '../shared/index';
import { ComponentInstance } from './component';

export function emit(instance: ComponentInstance, event: string, ...args: any[]) {
  console.log('emit', event);

  // instance.props -> event
  const { props } = instance;

  const handlerName = toEventHandlerKey(event);
  const handler = props[handlerName];

  handler && handler(...args);
}
