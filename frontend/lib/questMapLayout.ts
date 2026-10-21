export type QuestMapLayoutNode = {
  x: number;
  y: number;
};

export type QuestMapLayout = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  pathD: string;
  nodes: QuestMapLayoutNode[];
};

// Layout constants, in SVG user units. The path winds between two lanes
// (left/right of the label it carries) so it reads as a park path rather
// than a straight line, same idea as the approved SVG-park mockup, but
// generalized to any node count instead of 8 hand-placed coordinates.
export const BADGE_RADIUS = 34;
export const LABEL_GAP = 14;
export const LABEL_WIDTH = 190;
export const LABEL_HEIGHT = 64;
const LANE_OFFSET = 60;
const MARGIN_X = 24;
const Y_SPACING = 150;
const MARGIN_Y = 90;

// Left lane sits close to the left edge; the right lane is offset far enough
// past where a left-lane label ends that labels on either lane never
// overlap a node in the same row. Because the whole scene is one <svg> with
// a viewBox, this single winding shape scales down for mobile and up for
// desktop without needing a separate "ribbon on mobile, zigzag on tablet+"
// layout — unlike the old flat <ul> version, there's no CSS breakpoint here.
export const LANE_LEFT_X = MARGIN_X + BADGE_RADIUS;
const LEFT_LABEL_END = LANE_LEFT_X + BADGE_RADIUS + LABEL_GAP + LABEL_WIDTH;
export const LANE_RIGHT_X = LEFT_LABEL_END + LANE_OFFSET;

export function buildQuestMapLayout(nodeCount: number): QuestMapLayout {
  const count = Math.max(1, nodeCount);
  const viewBoxWidth = LANE_RIGHT_X + BADGE_RADIUS + MARGIN_X;
  const viewBoxHeight = MARGIN_Y * 2 + (count - 1) * Y_SPACING;

  const nodes: QuestMapLayoutNode[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: i % 2 === 0 ? LANE_LEFT_X : LANE_RIGHT_X,
      y: viewBoxHeight - MARGIN_Y - i * Y_SPACING,
    });
  }

  let pathD = `M${nodes[0].x},${nodes[0].y}`;
  if (count === 1) {
    pathD += ` L${nodes[0].x},${nodes[0].y}`;
  }
  for (let i = 1; i < count; i++) {
    const prev = nodes[i - 1];
    const cur = nodes[i];
    const diff = prev.y - cur.y;
    const c1y = prev.y - diff / 3;
    const c2y = cur.y + diff / 3;
    pathD += ` C${prev.x},${c1y} ${cur.x},${c2y} ${cur.x},${cur.y}`;
  }

  return { viewBoxWidth, viewBoxHeight, pathD, nodes };
}
