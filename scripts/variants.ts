/* Sunday review helper. Usage:
   npm run variants -- --kp arith-sum-of-squares --n 2 --seed 7
   npm run variants -- --lecture gs-autumn-4-l01 --n 4 --seed 7
   Adapted from the makeItems entry point in kenowong/pep-math-coach js/olympiad.js.
   That repository has no license. */

import { generateVariants } from "../src/engine/generate";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

const id = arg("--kp") ?? arg("--lecture");
const n = Number(arg("--n") ?? "2");
const seed = Number(arg("--seed") ?? "1");

if (!id || !Number.isInteger(n) || n < 1 || !Number.isInteger(seed)) {
  console.error("用法：npm run variants -- --kp <知识点id> --n 2 --seed 7");
  console.error("      npm run variants -- --lecture <讲次id> --n 2 --seed 7");
  process.exit(1);
}

const variants = generateVariants(id, n, seed);
if (variants.length === 0) {
  console.error(`「${id}」没有可以出题的引擎（可能是待补讲次，或 id 写错了）。`);
  process.exit(1);
}

console.log(JSON.stringify({ id, n, seed, variants }, null, 2));
