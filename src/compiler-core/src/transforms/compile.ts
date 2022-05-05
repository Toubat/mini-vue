import { generate } from '../codegen';
import { baseParse } from '../parse';
import { transform } from '../transform';
import { transformElement } from './transformElement';
import { transformExpression } from './transformExpression';
import { transformText } from './transformText';

export function baseCompile(template) {
  const ast: any = baseParse(template);

  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });

  return generate(ast);
}
