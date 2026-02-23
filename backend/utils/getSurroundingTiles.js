export const getSurroundingTiles = (x, y) => {
  const tiles = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      tiles.push({ x: x + dx, y: y + dy });
    }
  }

  return tiles;
};
