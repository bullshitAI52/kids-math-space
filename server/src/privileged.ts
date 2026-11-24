// Privileged host functions: the ONLY code allowed to touch the host
// filesystem for this artifact. Read-only contracts, all fetching
// card images from exact known paths: the four starter cards
// (readSeedImages), the 13 cards of the v3 batch (readSeedImagesV3), the
// 6 cards of the v4 batch (readSeedImagesV4), and the 5 cards of the v5
// batch (readSeedImagesV5) —
// user-sent photos under ~/workspace/user/files/ plus clean diagrams
// drawn for this artifact in server/assets/. No path ever comes from the
// client or the action.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
definePrivilegedContracts,
definePrivilegedHandlers,
z,
} from "@hatch/space-sdk";

// NOTE: the contract generator copies these literals verbatim into the
// generated contract module, so every schema below must be fully inline —
// no references to local helper consts.
export const privileged = definePrivilegedContracts({
  readSeedImages: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV3: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV4: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV5: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV6: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV7: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV8: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV9: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
  readSeedImagesV10: {
    request: z.object({}),
    response: z.object({
      images: z.array(
        z.object({
          slot: z.string(),
          dataBase64: z.string(),
          mimeType: z.string(),
        }),
      ),
    }),
    timeoutMs: 30000,
  },
});

// slot -> exact source for that starter card's image. Three cards use the
// photos the user sent (under ~/workspace/user/files/); the sumSquare card
// uses a clean area diagram drawn for this artifact, because the photo the
// user sent for it was a video screenshot (hand, pen, player UI) — the
// replacement lives in this artifact's own server/assets/.
const SEED_FILES: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  {
    slot: "brackets",
    pathParts: [
      "workspace",
      "user",
      "files",
      "DC77C376-9379-411B-9E9E-13EF7F2EEE0C-photo-4E6F15BC-1939-499B-92A5-690A1B5DE0D9.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "cross",
    pathParts: [
      "workspace",
      "user",
      "files",
      "23F5B712-5AED-4F58-80F3-1E2F80A8FB8F-photo-D24414AA-9CC3-4DC0-B53E-648660098E09.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "diffSquare",
    pathParts: [
      "workspace",
      "user",
      "files",
      "8090C733-C7F2-441A-95BA-14BAD79FB42B-photo-683A3A44-048B-4CCB-98E5-23102667A8D2.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "sumSquare",
    pathParts: [
      "workspace",
      "ts-spaces",
      "xiao-hai-shu-xue-kong-jian",
      "server",
      "assets",
      "sum-square.png",
    ],
    mimeType: "image/png",
  },
];

// slot -> exact source for the 13 cards added in the v3 batch (two batches
// the user sent on 2026-11-25). Four are the user's finished teaching
// images used as-is; nine are clean diagrams drawn for this artifact
// (handwritten drafts, CAD screen photos, and exercise pages are never
// used directly), stored in this artifact's server/assets/.
const ASSETS = [
  "workspace",
  "ts-spaces",
  "xiao-hai-shu-xue-kong-jian",
  "server",
  "assets",
] as const;

const SEED_FILES_V3: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  {
    slot: "sameSideInterior",
    pathParts: [
      "workspace",
      "user",
      "files",
      "2381FA76-C60D-422B-985F-DEDA64D808FA-photo-7448CAFA-966F-4F82-9EA1-2996691DCCF4.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "parallelogramAngles",
    pathParts: [
      "workspace",
      "user",
      "files",
      "76AFCF0A-3C0E-42A6-8CA4-AC2C1535BDE3-photo-5E0FE8D8-7CEB-49B9-8F5F-2D77B4F08E3D.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "correspondenceOrder",
    pathParts: [
      "workspace",
      "user",
      "files",
      "26020324-206B-46EB-822F-1DAD9EAA778D-photo-661A5E08-18FA-4B9B-90D9-3971240F1A42.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "bracketRule",
    pathParts: [
      "workspace",
      "user",
      "files",
      "7F62555D-08E1-456F-B943-66FD3DF2DA75-photo-34DCEB45-13A1-43E6-8080-07A6419B2C3B.jpg",
    ],
    mimeType: "image/jpeg",
  },
  { slot: "squareSpeed", pathParts: [...ASSETS, "square-speed.png"], mimeType: "image/png" },
  { slot: "bracketFirst", pathParts: [...ASSETS, "bracket-first.png"], mimeType: "image/png" },
  { slot: "congruenceFive", pathParts: [...ASSETS, "congruence-five.png"], mimeType: "image/png" },
  { slot: "segmentAdd", pathParts: [...ASSETS, "segment-add.png"], mimeType: "image/png" },
  { slot: "overlapSplit", pathParts: [...ASSETS, "overlap-split.png"], mimeType: "image/png" },
  { slot: "kiteCommon", pathParts: [...ASSETS, "kite-common.png"], mimeType: "image/png" },
  { slot: "commonAngle", pathParts: [...ASSETS, "common-angle.png"], mimeType: "image/png" },
  { slot: "combineTerms", pathParts: [...ASSETS, "combine-terms.png"], mimeType: "image/png" },
  { slot: "bracketEquation", pathParts: [...ASSETS, "bracket-equation.png"], mimeType: "image/png" },
];

// slot -> exact source for the 6 cards of the v4 batch (third send,
// 2026-11-25): three finished teaching images used as-is, three redrawn
// clean diagrams in server/assets/.
const SEED_FILES_V4: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  {
    slot: "parallelogramAltAngles",
    pathParts: [
      "workspace",
      "user",
      "files",
      "4372CAB2-62BA-4CA2-A41F-1E39CD992F14-photo-900BE268-0629-43B6-8F62-8839821637CC.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "parallelCriterion",
    pathParts: [
      "workspace",
      "user",
      "files",
      "31AF1719-DFF4-4EE5-AA7D-DA9B77550366-photo-8774EB0B-451B-4AA4-A549-30A835967BC8.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "minusToPlus",
    pathParts: [
      "workspace",
      "user",
      "files",
      "30EC510D-58C0-4141-BF2A-275837507187-photo-8211292A-4AC3-4AE7-BA6F-2E3C058A80A6.jpg",
    ],
    mimeType: "image/jpeg",
  },
  { slot: "diffSquares", pathParts: [...ASSETS, "diff-squares.png"], mimeType: "image/png" },
  { slot: "inequalityRight", pathParts: [...ASSETS, "inequality-right.png"], mimeType: "image/png" },
  { slot: "cowGrass", pathParts: [...ASSETS, "cow-grass.png"], mimeType: "image/png" },
];

// slot -> exact source for the 5 cards of the v5 batch (fourth send,
// 2026-11-25): two finished teaching images used as-is, three redrawn
// clean diagrams in server/assets/.
const SEED_FILES_V5: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  {
    slot: "moneySave",
    pathParts: [
      "workspace",
      "user",
      "files",
      "45118E85-A256-4AD0-B7E6-048297D4CAD6-photo-2E6182AB-AE3D-4D5A-BF84-F002D7343628.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "commonFactor",
    pathParts: [
      "workspace",
      "user",
      "files",
      "69F342B2-12AF-422F-B88C-72C1038AAEA3-photo-70ADDD44-C429-4676-9120-70C70F538355.jpg",
    ],
    mimeType: "image/jpeg",
  },
  { slot: "signRules", pathParts: [...ASSETS, "sign-rules.png"], mimeType: "image/png" },
  { slot: "splitEquation", pathParts: [...ASSETS, "split-equation.png"], mimeType: "image/png" },
  { slot: "inequalityMove", pathParts: [...ASSETS, "inequality-move.png"], mimeType: "image/png" },
];

// slot -> exact source for the 3 cards of the v6 batch (fifth send,
// 2026-11-25): all three are redrawn clean diagrams in server/assets/
// (the sources were a printed handout and handwritten drafts; the
// chicken-rabbit draft's matrix answer was wrong, so the card uses the
// 假设法 worked in the brief instead). The 7 programming images from
// the same send are deliberately NOT carded, pending the user's call.
const SEED_FILES_V6: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  { slot: "arithmeticSeq", pathParts: [...ASSETS, "arithmetic-seq.png"], mimeType: "image/png" },
  { slot: "treePlanting", pathParts: [...ASSETS, "tree-planting.png"], mimeType: "image/png" },
  { slot: "chickenRabbit", pathParts: [...ASSETS, "chicken-rabbit.png"], mimeType: "image/png" },
];

// slot -> exact source for the 11 cards of the v7 batch (2026-11-25):
// the 6 programming cards left over from the fifth send (the user asked
// to file them under a new 编程 category), the 4 cards of the sixth
// send, and 1 card from the seventh send. Five are the user's finished
// images used as-is; six are redrawn clean diagrams in server/assets/
// (garbled posters and handwritten drafts are never used directly).
const SEED_FILES_V7: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  { slot: "encapsulation", pathParts: [...ASSETS, "encapsulation.png"], mimeType: "image/png" },
  {
    slot: "classObject",
    pathParts: [
      "workspace",
      "user",
      "files",
      "74A91C1D-69F8-4E5F-B774-22AF087983D3-photo-9D379F13-6651-4E8E-831C-C660CD1BABA9.jpg",
    ],
    mimeType: "image/jpeg",
  },
  { slot: "abstractionFruit", pathParts: [...ASSETS, "abstraction-fruit.png"], mimeType: "image/png" },
  { slot: "oopThree", pathParts: [...ASSETS, "oop-three.png"], mimeType: "image/png" },
  {
    slot: "classMold",
    pathParts: [
      "workspace",
      "user",
      "files",
      "9A1FD9DF-5760-4940-BB2D-3B638C41090D-photo-D799E3FB-E770-44A6-B229-3A29F70EC912.jpg",
    ],
    mimeType: "image/jpeg",
  },
  { slot: "pythonSymbols", pathParts: [...ASSETS, "python-symbols.png"], mimeType: "image/png" },
  {
    slot: "seqTrees",
    pathParts: [
      "workspace",
      "user",
      "files",
      "AFF368A2-DF9C-400E-A2DA-28A0382CEC28-photo-27CCFD4C-3B44-4FF1-9916-6EB70F4E2A94.jpg",
    ],
    mimeType: "image/jpeg",
  },
  { slot: "elimination", pathParts: [...ASSETS, "elimination.png"], mimeType: "image/png" },
  { slot: "cowGrassParts", pathParts: [...ASSETS, "cow-grass-parts.png"], mimeType: "image/png" },
  {
    slot: "cowGrassForever",
    pathParts: [
      "workspace",
      "user",
      "files",
      "466E4C7B-4CDE-4713-993F-4A7A31D12E87-photo-8C4A160D-171C-4E82-9A04-FED2A4E14CC2.jpg",
    ],
    mimeType: "image/jpeg",
  },
  {
    slot: "plusOmit",
    pathParts: [
      "workspace",
      "user",
      "files",
      "9768324C-4D9D-4C9B-8FCE-F8EF286B15E8-photo-573C14DB-5319-4DF8-89C8-5D6862556205.jpg",
    ],
    mimeType: "image/jpeg",
  },
];

// slot -> exact source for the v8 batch (2026-11-25): 7 new cards
// (rational numbers x4, inequalities x3) plus clean redraws that replace
// the images of 2 existing cards whose pictures are handwritten photos.
// All nine are redrawn clean diagrams in server/assets/.
const SEED_FILES_V8: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  { slot: "rationalTree", pathParts: [...ASSETS, "rational-tree.png"], mimeType: "image/png" },
  { slot: "oppositeAbs", pathParts: [...ASSETS, "opposite-abs.png"], mimeType: "image/png" },
  { slot: "rationalAddSub", pathParts: [...ASSETS, "rational-addsub.png"], mimeType: "image/png" },
  { slot: "rationalMulDiv", pathParts: [...ASSETS, "rational-muldiv.png"], mimeType: "image/png" },
  { slot: "ineqProperties", pathParts: [...ASSETS, "ineq-properties.png"], mimeType: "image/png" },
  { slot: "ineqSteps", pathParts: [...ASSETS, "ineq-steps.png"], mimeType: "image/png" },
  { slot: "ineqSystem", pathParts: [...ASSETS, "ineq-system.png"], mimeType: "image/png" },
  { slot: "cowGrassForeverNew", pathParts: [...ASSETS, "cow-grass-forever.png"], mimeType: "image/png" },
  { slot: "classMoldNew", pathParts: [...ASSETS, "class-mold.png"], mimeType: "image/png" },
];

// slot -> exact source for the v9 batch (2026-11-25): 15 new cards —
// Pythagoras x3, inequalities x4, coordinate plane x4, roots x4. All
// fifteen are redrawn clean diagrams in server/assets/.
const SEED_FILES_V9: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  { slot: "pythagoras", pathParts: [...ASSETS, "pythagoras.png"], mimeType: "image/png" },
  { slot: "pythagorasConverse", pathParts: [...ASSETS, "pythagoras-converse.png"], mimeType: "image/png" },
  { slot: "ladderWall", pathParts: [...ASSETS, "ladder-wall.png"], mimeType: "image/png" },
  { slot: "ineqSymbols", pathParts: [...ASSETS, "ineq-symbols.png"], mimeType: "image/png" },
  { slot: "ineqKeywords", pathParts: [...ASSETS, "ineq-keywords.png"], mimeType: "image/png" },
  { slot: "ineqInteger", pathParts: [...ASSETS, "ineq-integer.png"], mimeType: "image/png" },
  { slot: "ineqSystemExample", pathParts: [...ASSETS, "ineq-system-example.png"], mimeType: "image/png" },
  { slot: "coordSystem", pathParts: [...ASSETS, "coord-system.png"], mimeType: "image/png" },
  { slot: "coordQuadrants", pathParts: [...ASSETS, "coord-quadrants.png"], mimeType: "image/png" },
  { slot: "coordDistance", pathParts: [...ASSETS, "coord-distance.png"], mimeType: "image/png" },
  { slot: "coordSymmetry", pathParts: [...ASSETS, "coord-symmetry.png"], mimeType: "image/png" },
  { slot: "sqrtBasic", pathParts: [...ASSETS, "sqrt-basic.png"], mimeType: "image/png" },
  { slot: "sqrtTable", pathParts: [...ASSETS, "sqrt-table.png"], mimeType: "image/png" },
  { slot: "sqrtSimplify", pathParts: [...ASSETS, "sqrt-simplify.png"], mimeType: "image/png" },
  { slot: "cbrtCompare", pathParts: [...ASSETS, "cbrt-compare.png"], mimeType: "image/png" },
];

// slot -> exact source for the v10 batch (2026-11-25): 4 new vector
// cards, all filed under 几何. All four are redrawn clean diagrams in
// server/assets/.
const SEED_FILES_V10: ReadonlyArray<{
  slot: string;
  pathParts: string[];
  mimeType: string;
}> = [
  { slot: "vectorBasic", pathParts: [...ASSETS, "vector-basic.png"], mimeType: "image/png" },
  { slot: "vectorAddSub", pathParts: [...ASSETS, "vector-addsub.png"], mimeType: "image/png" },
  { slot: "vectorCoord", pathParts: [...ASSETS, "vector-coord.png"], mimeType: "image/png" },
  { slot: "vectorDot", pathParts: [...ASSETS, "vector-dot.png"], mimeType: "image/png" },
];

function readSeedFiles(
  files: ReadonlyArray<{ slot: string; pathParts: string[]; mimeType: string }>,
): Array<{ slot: string; dataBase64: string; mimeType: string }> {
  const home = homedir();
  const images: Array<{ slot: string; dataBase64: string; mimeType: string }> =
    [];
  for (const { slot, pathParts, mimeType } of files) {
    const path = join(home, ...pathParts);
    if (!existsSync(path)) continue;
    const bytes = readFileSync(path);
    images.push({ slot, dataBase64: bytes.toString("base64"), mimeType });
  }
  return images;
}

export const privilegedHandlers = definePrivilegedHandlers(privileged, {
  async readSeedImages() {
    return { images: readSeedFiles(SEED_FILES) };
  },
  async readSeedImagesV3() {
    return { images: readSeedFiles(SEED_FILES_V3) };
  },
  async readSeedImagesV4() {
    return { images: readSeedFiles(SEED_FILES_V4) };
  },
  async readSeedImagesV5() {
    return { images: readSeedFiles(SEED_FILES_V5) };
  },
  async readSeedImagesV6() {
    return { images: readSeedFiles(SEED_FILES_V6) };
  },
  async readSeedImagesV7() {
    return { images: readSeedFiles(SEED_FILES_V7) };
  },
  async readSeedImagesV8() {
    return { images: readSeedFiles(SEED_FILES_V8) };
  },
  async readSeedImagesV9() {
    return { images: readSeedFiles(SEED_FILES_V9) };
  },
  async readSeedImagesV10() {
    return { images: readSeedFiles(SEED_FILES_V10) };
  },
});
