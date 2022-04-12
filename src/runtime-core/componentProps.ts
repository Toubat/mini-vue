import { ComponentInstance } from './component';

export function initProps(instance: ComponentInstance, rawProps: any) {
  instance.props = rawProps || {};
  // TODO: attrs
}
