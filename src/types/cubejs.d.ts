declare module 'cubejs' {
  interface CubeJson {
    center: number[];
    cp: number[];
    co: number[];
    ep: number[];
    eo: number[];
  }

  class Cube {
    constructor(state?: CubeJson);
    asString(): string;
    move(sequence: string): Cube;
    solve(maxDepth?: number): string;
    static fromString(facelets: string): Cube;
    static initSolver(): void;
  }

  export = Cube;
}
