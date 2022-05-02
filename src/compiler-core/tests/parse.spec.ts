import { NodeType } from '../src/ast';
import { baseParse } from '../src/parse';

describe('Parse', () => {
  describe('interpolation', () => {
    test('simple interpolation', () => {
      const ast = baseParse('{{ message }}');

      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeType.INTERPOLATION,
        content: {
          type: NodeType.SIMPLE_EXPRESSION,
          content: 'message',
        },
      });
    });
  });

  describe('element', () => {
    it('simple element div', () => {
      const ast = baseParse('<div></div>');

      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeType.ELEMENT,
        tag: 'div',
        children: [],
      });
    });
  });

  describe('text', () => {
    it('simple text', () => {
      const ast = baseParse('some text');

      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeType.TEXT,
        content: 'some text',
      });
    });
  });

  describe('composite test', () => {
    it('hello world', () => {
      const ast = baseParse('<div>hi, {{ message }}</div>');

      expect(ast.children[0]).toStrictEqual({
        type: NodeType.ELEMENT,
        tag: 'div',
        children: [
          {
            type: NodeType.TEXT,
            content: 'hi, ',
          },
          {
            type: NodeType.INTERPOLATION,
            content: {
              type: NodeType.SIMPLE_EXPRESSION,
              content: 'message',
            },
          },
        ],
      });
    });

    it('Nested element', () => {
      const ast = baseParse('<div><p>hi, </p>{{ message }}</div>');

      expect(ast.children[0]).toStrictEqual({
        type: NodeType.ELEMENT,
        tag: 'div',
        children: [
          {
            type: NodeType.ELEMENT,
            tag: 'p',
            children: [
              {
                type: NodeType.TEXT,
                content: 'hi, ',
              },
            ],
          },
          {
            type: NodeType.INTERPOLATION,
            content: {
              type: NodeType.SIMPLE_EXPRESSION,
              content: 'message',
            },
          },
        ],
      });
    });

    it('no close tag', () => {
      expect(() => {
        baseParse('<div><span></div>');
      }).toThrow('Missing close tag: span');
    });
  });
});
