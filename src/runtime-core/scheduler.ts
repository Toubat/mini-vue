import { ComponentInstance } from './component';

type UpdateFunction = ComponentInstance['update'];

const p = Promise.resolve();
const queue: UpdateFunction[] = [];

let isFlushPending = false;

export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queueJobs(job: UpdateFunction) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}

export function queueFlush() {
  if (isFlushPending) return;

  isFlushPending = true;
  nextTick(() => {
    flushJobs();
  });
}

function flushJobs() {
  let job;
  isFlushPending = false;
  while ((job = queue.shift())) {
    job && job();
  }
}
