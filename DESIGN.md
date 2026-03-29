# Up Next — Design & Implementation Plan

## Overview

**Up Next** — a personal movie rating and recommendation app for iPhone. Built with React Native + Expo, developed in VSCode, tested in Xcode simulator.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React Native + Expo | VSCode-friendly, good gesture libraries |
| Navigation | Expo Router | File-based, clean tab structure |
| Gestures | React Native Gesture Handler + Reanimated | Swipe card animations |
| State | Zustand | Lightweight, easy multi-user migration later |
| Persistence | AsyncStorage | Local storage, survives app close |
| Movie Data | TMDB API | Free, comprehensive, has similar movies endpoint |

---

## App Structure

4 tabs + an onboarding flow:

```
Discover  |  Rate  |  Compare  |  Stats
```

First launch skips Discover (no data yet) and drops the user into **Rate** with trending/popular movies to seed their taste.

---

## Tab 1 — Discover

- One movie card at a time showing: **poster, title, year, genres**
- **Purpose is browsing, not rating** — swipe in any direction to dismiss and see the next recommendation
- Dismissed movies are not rated — they'll reappear in future recommendation cycles
- Small "Rate this" button on the card — tapping opens `RatingActionSheet` (bucket picker) without leaving the tab
- After picking a bucket in the action sheet, the card auto-dismisses and the next recommendation loads
- Tapping the card (not "Rate this") opens the movie detail screen
- Source: recommendations engine (see below)

---

## Tab 2 — Rate

- Swipe feed showing: **poster, title only**
- Swipe gestures:
  - Right → like
  - Left → dislike
  - Bottom-right → love
  - Down → haven't seen
- Tapping the card opens the movie detail screen
- Search bar at top — search by title, tap result to bring it up as the current card, rate it, return to feed
- Feed starts with trending movies and progressively expands — the goal is to eventually cycle through every movie in the TMDB database if the user keeps going
- When the current page of movies is exhausted, automatically loads the next batch

---

## Tab 3 — Compare

- Two movie posters side by side — tap to pick the one you liked more
- App selects pairs automatically, prioritising:
  - Same bucket (liked vs liked, loved vs loved)
  - Movies with lowest confidence first (fewest comparisons, most in need of signals)
  - Skips pairs already resolvable by transitivity (if A > B and B > C, skip A vs C)
  - **At most one unrated movie per pair** — never two unrated movies together
- After tap: immediately loads next pair, no summary screen
- When one movie in a pair is unrated, a quick prompt appears after the pick: "How did you feel about [the other movie]?" with bucket options, to capture a rating while the opinion is fresh
- **Skip button** — if you don't remember one of the movies well enough to compare, skip loads a new pair
- **Empty state (no ratings yet):** message telling the user they need to rate movies first before comparisons are possible
- **Empty state (all resolved):** message indicating all comparisons are complete and rankings are up to date

---

## Tab 4 — Stats

- Overview of your rating activity, e.g.:
  - Total movies rated, broken down by bucket
  - Score distribution chart (how many movies at each score)
  - Top genres by average score
  - Most compared movies
  - Movies with low confidence (few comparisons) — nudges you toward the Compare tab
- Read-only view — no actions, just data derived from the ratings store

---

## Buckets & Ratings

4 tiers:

| Bucket | How you get there |
|--------|------------------|
| Loved | Bottom-right swipe |
| Liked | Right swipe, or winning a comparison |
| Disliked | Left swipe |
| Unseen | Down swipe |

- Losing a comparison does **not** demote a movie out of its bucket
- Disliked movies have a small negative influence on recommendations (don't recommend too-similar films)

### 1–10 Rating Score

Every rated movie has a numeric score from **1.0 to 10.0** (one decimal place). This is derived automatically from bucket + position in the comparison DAG:

| Bucket | Score range |
|--------|------------|
| Loved | 8.0 – 10.0 |
| Liked | 5.0 – 7.9 |
| Disliked | 1.0 – 4.9 |

Within each bucket, a movie's exact score is calculated from its rank position in the DAG — top of the bucket scores near the ceiling, bottom scores near the floor. Movies with no comparisons yet default to the bucket midpoint (Loved → 9.0, Liked → 6.5, Disliked → 3.0). Unseen movies have no score.

### Confidence

Every rated movie also carries a **confidence level** reflecting how many comparisons have shaped its score:

| Comparisons | Confidence | Display |
|-------------|------------|---------|
| 0 | None | Score shown as `~9.0` (greyed, italicised) |
| 1–2 | Low | Score shown as `~7.4` with a weak indicator |
| 3–6 | Medium | Score shown normally with a medium indicator |
| 7+ | High | Score shown normally with a strong indicator |

- Low-confidence movies are **prioritised** in the Compare tab pair picker
- The Stats tab surfaces movies with low confidence as a prompt to keep comparing
- Confidence is derived from comparison count — not stored separately, calculated on the fly

---

## Data Model

```
Movie
  tmdb_id       — TMDB's unique ID
  title         — movie title
  poster_url    — full URL to poster image
  year          — release year
  genres        — array of genre strings

Rating
  movie_id      — references Movie.tmdb_id
  bucket        — loved | liked | disliked | unseen
  score         — derived 1.0–10.0 (null for unseen)
  timestamp     — when rated

Comparison
  winner_id     — references Movie.tmdb_id
  loser_id      — references Movie.tmdb_id
  timestamp     — when compared
```

- Removing a rating clears the bucket and score for that movie. Comparison history involving that movie is **preserved** (the comparisons happened — they still inform other movies' relative ranks).
- Comparison history forms a **directed acyclic graph (DAG)**. Ranking within a bucket and all score derivations come from this graph.

---

## Recommendations Engine

1. Pull user's top ~20 movies (weighted: loved > liked, using score)
2. Query TMDB "similar movies" for each
3. Exclude already-rated movies
4. Score candidates by: similarity match count + TMDB global popularity
5. Serve one at a time on the Discover tab, resurfacing "unseen" movies too

*Future: proper collaborative filtering or vector similarity model.*

---

## Rate Feed Pagination

The Rate tab feed is effectively infinite:

1. Start with TMDB trending movies (page 1)
2. When exhausted, move to popular movies (paginated)
3. When exhausted, move to top-rated (paginated)
4. Continue expanding through other TMDB discovery endpoints
5. Skip any movie already in the user's ratings store
6. Eventually covers a very large portion of the TMDB catalogue

---

## State & Persistence

- Zustand store holds all ratings, comparisons, and derived rankings in memory
- AsyncStorage syncs store to disk on every write
- Store designed so it can later be backed by a remote DB (multi-user migration path)

---

## File Plan

Every file that will exist in the project, grouped by folder.

### Root

| File | Purpose |
|------|---------|
| `.env` | Stores `EXPO_PUBLIC_TMDB_API_KEY`. Never committed to git. |
| `.env.example` | Template showing required env vars with blank values, safe to commit. |
| `app.json` | Expo project config — app name, bundle ID, icon, splash screen settings. |
| `tsconfig.json` | TypeScript config. Extends Expo's base config, adds path aliases. |
| `package.json` | Dependencies and scripts. |
| `DESIGN.md` | This file. |

---

### app/

Expo Router treats every file here as a route.

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout. Wraps the whole app in gesture handler context, sets up Zustand store hydration from AsyncStorage, and redirects to onboarding on first launch. |
| `app/onboarding.tsx` | First-launch screen. Brief explanation of the app, then navigates to the Rate tab. Only shown once — a flag in the store marks it complete. |
| `app/(tabs)/_layout.tsx` | Defines the 4-tab bar (Discover, Rate, Compare, Stats) including icons and labels. Controls which tab is the default. |
| `app/(tabs)/index.tsx` | **Discover tab.** Renders a single `DiscoverCard` fed by the recommendations engine. Swiping any direction dismisses without rating. "Rate this" button opens `RatingActionSheet`, which auto-dismisses the card on selection. |
| `app/(tabs)/rate.tsx` | **Rate tab.** Renders a paginated swipeable feed starting with trending movies, expanding infinitely. Contains `SearchBar` at the top. Tapping a card opens the movie detail screen. |
| `app/(tabs)/compare.tsx` | **Compare tab.** Renders two `CompareCard` components side by side. Uses `pickNextPair()` from `ranking.ts` to select the next pair. Has a skip button and two empty state messages (no ratings yet vs. all comparisons resolved). |
| `app/(tabs)/stats.tsx` | **Stats tab.** Read-only screen showing rating counts by bucket, score distribution, top genres by average score, and most compared movies. Derived entirely from the ratings store. |
| `app/movie/[id].tsx` | Movie detail screen. Shows full metadata (poster, title, year, genres, score, bucket). Contains the "remove rating" action, which clears bucket/score only. Reachable by tapping any movie card. |

---

### components/

Reusable UI pieces. No business logic — they receive props and emit events.

| File | Purpose |
|------|---------|
| `components/SwipeCard.tsx` | Core swipeable card for the Rate tab. Handles four directional swipes via Gesture Handler + Reanimated, animates off-screen on completion, shows `SwipeHintOverlay` during drag. Displays poster and title. |
| `components/DiscoverCard.tsx` | Swipeable card for the Discover tab. Any swipe direction dismisses with no rating. Displays poster, title, year, and genres. Includes a "Rate this" button and is tappable to open movie detail. |
| `components/RatingActionSheet.tsx` | Bottom sheet with four bucket options (Loved / Liked / Disliked / Haven't seen). Opens from Discover's "Rate this" button. On selection, writes to the ratings store, closes, and signals the card to dismiss. |
| `components/CompareCard.tsx` | Non-swipeable pressable card for the Compare tab. Displays a movie poster and title, fires an `onPress` callback when tapped. |
| `components/MoviePoster.tsx` | Dumb component that renders a movie poster image at a given size with a fallback placeholder if the image fails to load. |
| `components/SearchBar.tsx` | Controlled text input for the Rate tab. Debounces input and calls a passed-in `onSearch` callback. Shows a clear button when text is present. |
| `components/SearchResultCard.tsx` | Single row in the search results list showing thumbnail, title, and year. Tappable — promotes the movie to the current swipe card. |
| `components/ScoreBadge.tsx` | Shows the derived 1–10 score alongside a confidence indicator. Low-confidence scores are prefixed with `~` and rendered more softly. Colour-coded by bucket range. Used on the detail screen and movie cards. |
| `components/BucketTag.tsx` | Small label showing which bucket a movie is in (Loved / Liked / Disliked / Unseen). Used on the detail screen. |
| `components/SwipeHintOverlay.tsx` | Semi-transparent directional overlay shown during a drag on `SwipeCard` (Rate tab only). Opacity scales with drag distance to preview the action that will fire. |
| `components/StatsChart.tsx` | Bar or histogram component for the Stats tab. Renders score distribution or genre breakdown. Accepts generic data so it can be reused for multiple charts on the stats screen. |
| `components/EmptyState.tsx` | Generic centred message + optional subtext component. Used for Compare empty states, and any other screen that needs a "nothing here yet" message. |

---

### services/

All external API calls. Nothing here touches the store — functions just fetch and return data.

| File | Purpose |
|------|---------|
| `services/tmdb.ts` | All TMDB API calls: `getTrending()`, `getPopular(page)`, `getTopRated(page)`, `searchMovies(query)`, `getMovieDetails(id)`, `getSimilarMovies(id)`. Reads API key from env, handles errors, maps raw responses to the `Movie` type. |

---

### store/

All app state.

| File | Purpose |
|------|---------|
| `store/ratingsStore.ts` | Main Zustand store. Holds `ratings` map (tmdb_id → Rating), `comparisons` list, `scores` map, and `onboardingComplete` flag. Actions: `rateMovie()`, `recordComparison()`, `removeRating()`, `markOnboardingComplete()`. Persists to AsyncStorage on every mutation. |
| `store/storage.ts` | Thin wrapper around AsyncStorage. Handles serialisation/deserialisation of store state. Called only by `ratingsStore.ts`. |
| `store/recommendationsStore.ts` | Lightweight store for the Discover tab's queue. Holds the current list of recommended movies and a cursor. Exposes `refreshQueue()` which calls the recommendations engine. Kept separate to avoid re-rendering the whole app on queue updates. |
| `store/feedStore.ts` | Tracks pagination state for the Rate tab's infinite feed — current source (trending/popular/top-rated), page number, and already-seen movie IDs. Exposes `getNextBatch()` which fetches the next page and filters out already-rated movies. |

---

### utils/

Pure functions — no side effects, no store access.

| File | Purpose |
|------|---------|
| `utils/ranking.ts` | DAG logic. `buildGraph(comparisons)` constructs an adjacency structure. `isTransitivelyResolved(graph, a, b)` checks if an outcome is already implied. `getRankOrder(graph, movieIds)` returns a sorted list. `pickNextPair(ratings, comparisons)` selects the best next pair — same bucket, least comparisons, not transitively resolved. |
| `utils/scoring.ts` | Derives the 1–10 score and confidence level. `deriveScore(bucket, rankPosition, totalInBucket)` maps rank to score range. `deriveConfidence(comparisonCount)` returns `none | low | medium | high`. |
| `utils/recommendations.ts` | Recommendation engine. `buildRecommendationQueue(ratings, scores)` pulls top ~20 movies, fetches TMDB similar movies, deduplicates, scores by similarity + popularity, returns an ordered `Movie[]` for the Discover queue. |
| `utils/stats.ts` | Pure stats derivations. `getCountsByBucket(ratings)`, `getScoreDistribution(scores)`, `getTopGenres(ratings, movies)`, `getMostCompared(comparisons)`. All used by the Stats tab. |

---

### types/

| File | Purpose |
|------|---------|
| `types/index.ts` | All shared TypeScript types: `Movie`, `Bucket`, `Rating`, `Comparison`, `Confidence`, `RatingsMap`, `ScoresMap`, `FeedSource`. Single source of truth — imported everywhere. |

---

### assets/

| File | Purpose |
|------|---------|
| `assets/icon.png` | App icon. Expo requires 1024×1024. Placeholder until a real icon is designed. |
| `assets/splash.png` | Splash screen image shown on launch. |
| `assets/fonts/` | Any custom fonts, if added later. Empty for now. |

---

## Testing

**Framework:** Jest + React Native Testing Library (included with Expo).

Every module gets unit tests written alongside it — tests live in a `__tests__/` folder mirroring the source structure (e.g. `utils/__tests__/ranking.test.ts`).

**What gets tested:**

| Area | What to cover |
|------|--------------|
| `utils/ranking.ts` | DAG construction, transitivity detection, pair-picking logic, edge cases (no comparisons, all resolved) |
| `utils/scoring.ts` | Score derivation per bucket/rank, confidence thresholds, boundary values |
| `utils/recommendations.ts` | Queue building, deduplication, exclusion of already-rated movies |
| `utils/stats.ts` | All stat derivation functions with known inputs/outputs |
| `store/ratingsStore.ts` | Each store action (rateMovie, recordComparison, removeRating) — verify state shape after mutations |
| Components | Render smoke tests for key components; interaction tests for swipe logic and button presses |

**Run after every change:** Jest watch mode (`npm test -- --watch`) keeps tests running continuously during development. Before committing, full suite runs via `npm test`.

---

## Implementation Phases

| Phase | What |
|-------|------|
| 1 | Project scaffold + navigation shell (4 empty tabs) |
| 2 | TMDB service layer (`services/tmdb.ts`) |
| 3 | Types, store, and persistence (`types/`, `store/`) + store tests |
| 4 | Rate tab — swipe cards, gestures, infinite feed pagination |
| 5 | Compare tab — side-by-side picker, DAG logic, skip, empty states + ranking/scoring tests |
| 6 | Discover tab — recommendation queue, DiscoverCard, RatingActionSheet + recommendations tests |
| 7 | Stats tab + stats tests |
| 8 | Onboarding flow |
| 9 | Search + movie detail screen + remove rating |
| 10 | Polish — dark/light mode, transitions, score badge colours, edge cases |

---

## Nice to Haves

Features to revisit after the core app is complete, in rough priority order:

| Feature | Notes |
|---------|-------|
| IMDb & Rotten Tomatoes scores | TMDB provides the IMDb ID per movie. OMDb API (free) returns both IMDb rating and RT score given an IMDb ID. One extra API call per movie. Display alongside the user's own score on the detail screen. |
| Collaborative filtering recommendations | Replace the TMDB "similar movies" approach with a proper model based on user rating patterns. |
| Multi-user / sync | Back the Zustand store with a remote DB. Social features (compare lists with friends) could follow. |

---

## Open Questions

- Recommendation weighting formula to be refined in Phase 6
- Stats charts — exact chart types TBD (bar chart, histogram, etc.) — decide in Phase 7
