export const gridSpacing = 130;

export const nodeRadius = 30;
export const nodeConnectionPointRadius = 8;
export const nodeConnectorSpacing = 12;

export const nodeTextWidth = nodeRadius * 4;
export const nodeTextHeight = nodeRadius * 2;

export function nodeCommentWidth(comment: string) {
  return (comment.length + 2) * 12; // 1.25rem
}
export const nodeCommentHeight = nodeRadius;

export enum Direction {
  NONE,
  NORTH,
  NORTH_EAST,
  EAST,
  SOUTH_EAST,
  SOUTH,
  SOUTH_WEST,
  WEST,
  NORTH_WEST,
  EAST_TEXT,
  WEST_TEXT,
}

const diagonalOffset = nodeRadius * (Math.sqrt(2) / 2);
export const directionOffsets: {
  [key in Direction]: { x: number; y: number };
} = {
  [Direction.NONE]: { x: 0, y: 0 },
  [Direction.NORTH]: { x: 0, y: -nodeRadius },
  [Direction.NORTH_EAST]: { x: diagonalOffset, y: -diagonalOffset },
  [Direction.EAST]: { x: nodeRadius, y: 0 },
  [Direction.SOUTH_EAST]: { x: diagonalOffset, y: diagonalOffset },
  [Direction.SOUTH]: { x: 0, y: nodeRadius },
  [Direction.SOUTH_WEST]: { x: -diagonalOffset, y: diagonalOffset },
  [Direction.WEST]: { x: -nodeRadius, y: 0 },
  [Direction.NORTH_WEST]: { x: -diagonalOffset, y: -diagonalOffset },
  [Direction.EAST_TEXT]: { x: nodeTextWidth / 2, y: 0 },
  [Direction.WEST_TEXT]: { x: -nodeTextWidth / 2, y: 0 },
};

const diagonalSpacing = nodeConnectorSpacing * (Math.sqrt(2) / 2);
export const spacingOffsets: {
  [key in Direction]: { x: number; y: number };
} = {
  [Direction.NONE]: { x: 0, y: 0 },
  [Direction.NORTH]: { x: nodeConnectorSpacing, y: 0 },
  [Direction.NORTH_EAST]: { x: diagonalSpacing, y: diagonalSpacing },
  [Direction.EAST]: { x: 0, y: nodeConnectorSpacing },
  [Direction.SOUTH_EAST]: { x: -diagonalSpacing, y: diagonalSpacing },
  [Direction.SOUTH]: { x: nodeConnectorSpacing, y: 0 },
  [Direction.SOUTH_WEST]: { x: diagonalSpacing, y: diagonalSpacing },
  [Direction.WEST]: { x: 0, y: nodeConnectorSpacing },
  [Direction.NORTH_WEST]: { x: -diagonalSpacing, y: diagonalSpacing },
  [Direction.EAST_TEXT]: { x: 0, y: nodeConnectorSpacing },
  [Direction.WEST_TEXT]: { x: 0, y: nodeConnectorSpacing },
};

const mapNodeDirections = (direction: Direction) => ({
  ...directionOffsets[direction],
  direction,
});

export const nodeRegisterDirections = [
  Direction.NORTH,
  Direction.NORTH_EAST,
  Direction.EAST,
  Direction.SOUTH_EAST,
  Direction.SOUTH,
  Direction.SOUTH_WEST,
  Direction.WEST,
  Direction.NORTH_WEST,
].map(mapNodeDirections);

export const nodeTextDirections = [
  Direction.NORTH,
  Direction.EAST_TEXT,
  Direction.SOUTH,
  Direction.WEST_TEXT,
].map(mapNodeDirections);
