# mini-vue

## Reactivity
- [x] reactive
- [x] readonly
- [x] shallow readonly
- [x] ref
- [x] proxy ref 
- [x] computed 
- [x] reactive effect
  - [x] custom scheduler
  - [x] on stop

## Runtime Core
- [x] virtual node and `h` API
- **Component initalization**
  - [x] handle mount stateful component, element, and text node
  - [x] handle mount children
  - [x] handle mount fragment node
  - [x] render named slots 
  - [x] get current instance API
  - [x] provider & dependency injection
  - [x] handle emit custom event
  - [x] support custom renderer 
- **Component update**
  - [x] handle props update
    1. props is modified, added
    2. props is deleted
    3. props is set to undefined or null
  - [x] handle children update
    - Diff:
      - [x] new elements appended to the end
      - [x] new elements appended to the start
      - [x] compare middle portion:
        1. add new elements
        2. remove old elements
        3. patch existing elements  
  - [x] handle component update
    - [x] optimize component update using microtasks  
  - [x] next tick 

## Compiler Module
- [ ] Todo
