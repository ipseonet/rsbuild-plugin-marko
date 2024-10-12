import { createHash } from 'node:crypto';
import path from 'node:path';

const CWD = process.cwd();

export default function (filename: string): string {
  const lastSepIndex = filename.lastIndexOf(path.sep);
  let name = filename.slice(
    lastSepIndex + 1,
    filename.indexOf('.', lastSepIndex),
  );

  if (name === 'index' || name === 'template') {
    name = filename.slice(
      filename.lastIndexOf(path.sep, lastSepIndex - 1) + 1,
      lastSepIndex,
    );
  }

  return `${name}_${createHash('MD5')
    .update(path.relative(CWD, filename))
    .digest('base64')
    .replace(/[/+]/g, '-')
    .slice(0, 4)}`;
}
