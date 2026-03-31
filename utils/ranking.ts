import { Comparison, RatingsMap } from '../types';

// Directed adjacency list: winner_id → [loser_ids it beat directly]
export type Graph = Record<number, number[]>;

export function buildGraph(comparisons: Comparison[]): Graph {
  const graph: Graph = {};
  for (const { winner_id, loser_id } of comparisons) {
    if (!graph[winner_id]) graph[winner_id] = [];
    graph[winner_id].push(loser_id);
  }
  return graph;
}

// DFS: can 'from' reach 'to' through the graph (i.e. from transitively beats to)?
function canReach(graph: Graph, from: number, to: number): boolean {
  const visited = new Set<number>();
  const stack = [from];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === to) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbor of graph[node] ?? []) {
      stack.push(neighbor);
    }
  }
  return false;
}

// True if the a vs b outcome is already implied by the existing comparison chain
export function isTransitivelyResolved(graph: Graph, a: number, b: number): boolean {
  return canReach(graph, a, b) || canReach(graph, b, a);
}

// Returns movieIds sorted highest-rank first.
// Rank = how many movies in the group each movie transitively beats.
export function getRankOrder(graph: Graph, movieIds: number[]): number[] {
  const beatsCount = new Map<number, number>();
  for (const id of movieIds) {
    let count = 0;
    for (const other of movieIds) {
      if (other !== id && canReach(graph, id, other)) count++;
    }
    beatsCount.set(id, count);
  }
  return [...movieIds].sort(
    (a, b) => (beatsCount.get(b) ?? 0) - (beatsCount.get(a) ?? 0)
  );
}

// Stable key for a pair regardless of order
function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

// Finds the best next pair to compare:
//   - same bucket (loved/liked/disliked only — not unseen)
//   - not already transitively resolved
//   - not in the excluded set (skipped pairs)
//   - prioritises movies with fewest total comparisons
// Returns null when all pairs are resolved (or fewer than 2 rated movies).
export function pickNextPair(
  ratings: RatingsMap,
  comparisons: Comparison[],
  excluded: ReadonlySet<string> = new Set()
): [number, number] | null {
  const graph = buildGraph(comparisons);

  // Total comparison count per movie (used as priority score)
  const compCount: Record<number, number> = {};
  for (const { winner_id, loser_id } of comparisons) {
    compCount[winner_id] = (compCount[winner_id] ?? 0) + 1;
    compCount[loser_id] = (compCount[loser_id] ?? 0) + 1;
  }

  // Group non-unseen rated movie IDs by bucket
  const byBucket: Record<string, number[]> = {};
  for (const [idStr, rating] of Object.entries(ratings)) {
    if (rating.bucket === 'unseen') continue;
    const id = Number(idStr);
    if (!byBucket[rating.bucket]) byBucket[rating.bucket] = [];
    byBucket[rating.bucket].push(id);
  }

  let bestPair: [number, number] | null = null;
  let bestScore = Infinity;

  for (const movies of Object.values(byBucket)) {
    for (let i = 0; i < movies.length; i++) {
      for (let j = i + 1; j < movies.length; j++) {
        const a = movies[i];
        const b = movies[j];
        if (excluded.has(pairKey(a, b))) continue;
        if (isTransitivelyResolved(graph, a, b)) continue;
        const score = (compCount[a] ?? 0) + (compCount[b] ?? 0);
        if (score < bestScore) {
          bestScore = score;
          bestPair = [a, b];
        }
      }
    }
  }

  return bestPair;
}

export { pairKey };
