import { getSequenceIndices } from '..';

describe('Longest increasing subsequence', () => {
  it('happy path', () => {
    const nums = [4, 2, 3];
    expect(getSequenceIndices(nums)).toEqual([1, 2]);
  });

  it('larger test', () => {
    const nums = [4, 2, 3, 1, 5];
    expect(getSequenceIndices(nums)).toEqual([1, 2, 4]);
  });
});
