import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';

export async function* readCsvInBatches<T>(
  filePath: string,
  batchSize: number,
): AsyncGenerator<T[]> {
  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    }),
  );
  let batch: T[] = [];
  for await (const record of parser) {
    batch.push(record as T);
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) yield batch;
}
