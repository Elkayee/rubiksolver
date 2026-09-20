import { describe, expect, it } from 'vitest';
import { parseNotation } from '../src/cube/notation';
import { createState } from '../src/cube/state';
import { readSession, SESSION_STORAGE_KEY, writeSession } from '../src/session-storage';

function memoryStorage() {
  let value: string | null = null;
  return {
    getItem: (key: string) => key === SESSION_STORAGE_KEY ? value : null,
    setItem: (key: string, next: string) => { if (key === SESSION_STORAGE_KEY) value = next; },
  };
}

describe('session storage', () => {
  it('round-trips cube state, scramble, solution, and step', () => {
    const storage = memoryStorage();
    const snapshot = {
      state: createState('U'.repeat(9) + 'R'.repeat(9) + 'F'.repeat(9) + 'D'.repeat(9) + 'L'.repeat(9) + 'B'.repeat(9)),
      scramble: "R U R' U'",
      solution: parseNotation("U R U' R'"),
      solutionIndex: 2,
    };
    writeSession(snapshot, storage);
    expect(readSession(storage)).toEqual(snapshot);
  });

  it('ignores malformed or unsafe facelet snapshots', () => {
    const storage = memoryStorage();
    storage.setItem(SESSION_STORAGE_KEY, '{"facelets":"not-a-cube"}');
    expect(readSession(storage)).toBeNull();
  });

  it('does not crash when browser storage is blocked', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    expect(readSession(blocked)).toBeNull();
    expect(() => writeSession({ state: createState(), scramble: '', solution: [], solutionIndex: 0 }, blocked)).not.toThrow();
  });
});
