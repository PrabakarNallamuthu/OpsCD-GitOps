import { readdirSync } from 'fs';
import { join } from 'path';

async function runSeeds(): Promise<void> {
  const seedsDir = __dirname;
  const seedFiles = readdirSync(seedsDir)
    .filter((f) => /^\d{2}-.*\.seed\.(ts|js)$/.test(f))
    .sort();

  console.log(`Found ${seedFiles.length} seed files`);

  for (const file of seedFiles) {
    console.log(`Running seed: ${file}`);
    const seed = (await import(join(seedsDir, file))) as { run?: () => Promise<void> };
    if (typeof seed.run === 'function') {
      await seed.run();
      console.log(`✓ ${file} complete`);
    }
  }

  console.log('All seeds complete');
}

runSeeds().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
