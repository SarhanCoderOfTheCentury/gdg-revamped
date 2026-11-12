export type Point = {x: number; y: number};
export const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export function boundOffset(point: Point, mobile: boolean): Point {
  return {x: clampValue(point.x, mobile ? -12 : -48, mobile ? 12 : 48), y: clampValue(point.y, mobile ? -14 : -48, mobile ? 14 : 48)};
}
export function connectionPath(start: Point, end: Point, mobile: boolean): string {
  const mid = mobile ? (start.y + end.y) / 2 : (start.x + end.x) / 2;
  return mobile ? `M ${start.x} ${start.y} C ${start.x} ${mid}, ${end.x} ${mid}, ${end.x} ${end.y}` : `M ${start.x} ${start.y} C ${mid} ${start.y}, ${mid} ${end.y}, ${end.x} ${end.y}`;
}
export const IDEAS = [
  {title: 'Give a campus problem a clever little solution.', steps: ['Ask three people', 'Sketch a better way', 'Build a tiny prototype'], tags: ['Explore', 'Create', 'Build']},
  {title: 'Make your next campus event easier to discover.', steps: ['Find a teammate', 'Map the experience', 'Build the first screen'], tags: ['Connect', 'Create', 'Build']},
  {title: 'Turn a workshop lesson into something useful.', steps: ['Pick one new skill', 'Try it on a real problem', 'Share what you learned'], tags: ['Explore', 'Build', 'Connect']},
  {title: 'Design a study planner that feels a little calmer.', steps: ['Talk to a student', 'Prototype one small feature', 'Ask for honest feedback'], tags: ['Connect', 'Create', 'Explore']},
  {title: 'Pair up. Build something neither of you has tried.', steps: ['Swap your strengths', 'Pick a weekend-sized idea', 'Demo it to a friend'], tags: ['Connect', 'Explore', 'Build']},
  {title: 'Reimagine the campus café, without the queue.', steps: ['Observe the bottleneck', 'Sketch a simple flow', 'Test your first prototype'], tags: ['Explore', 'Create', 'Build']},
];
export function nextIdeaIndex(current: number, random: number): number {
  return (current + 1 + Math.floor(clampValue(random, 0, .999999) * (IDEAS.length - 1))) % IDEAS.length;
}
