#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { constants } from 'node:fs';
import { lstat, open, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const schemaVersion = '2026-06-04.apo-owner-evidence-artifact-hashes.v1';

const usage = `Usage:
  npm run hash:owner-evidence-artifacts -- <local proof files...>

Purpose:
  Hash owner-held proof artifacts for commercial evidence and manual WCAG templates.
  The command prints JSON only, writes no files, and does not print source filenames or raw file contents.`;

const allowedOptions = new Set(['--help', '-h', '--json']);
const ownerProofOpenFlags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0);

function sha256Text(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

async function sha256OpenFile(fileHandle) {
  const hash = createHash('sha256');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let position = 0;

  for (;;) {
    const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length, position);
    if (bytesRead === 0) break;
    hash.update(buffer.subarray(0, bytesRead));
    position += bytesRead;
  }

  return `sha256:${hash.digest('hex')}`;
}

function basePayload() {
  return {
    schemaVersion,
    generatedAt: new Date().toISOString(),
    evidenceBoundary:
      'Hashes only. Raw proof artifacts, reviewer notes, partner names, contact details, contracts, private quotes, customer data, and salts remain owner-held outside git and chat.',
    safetyBoundary: {
      noFileWrites: true,
      noSourceFilenamesPrinted: true,
      noRawFileContentsPrinted: true,
      noSymlinkInputsAccepted: true,
      noHardLinkedInputsAccepted: true,
      canonicalPathGitBoundaryChecked: true,
      openedWithNoFollowFlag: constants.O_NOFOLLOW !== undefined,
      openedDescriptorValidatedBeforeHashing: true,
      pathSwapBeforeHashingRejected: true,
      rawArtifactsOwnerHeld: true,
    },
    doesNotProve: [
      'partner permission',
      'design-partner commitment',
      'documented outcome',
      'quote approval',
      'manual WCAG conformance',
      'legal compliance',
      'procurement approval',
      'live revenue',
      'production runtime behavior',
    ],
  };
}

function printJson(payload, stream = process.stdout) {
  stream.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function fail(errors) {
  printJson(
    {
      ok: false,
      ...basePayload(),
      artifactCount: 0,
      errors,
      nextUse:
        'Fix the local file inputs, rerun the command, then copy only proofArtifactHash values into ignored local evidence templates.',
    },
    process.stderr
  );
  process.exitCode = 1;
}

function nulList(output) {
  return String(output || '').split('\0').filter(Boolean);
}

function runGit(gitArgs, cwd = process.cwd()) {
  return spawnSync('git', gitArgs, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
}

function currentGitRoot() {
  const result = runGit(['rev-parse', '--show-toplevel']);
  if (result.status !== 0) return null;
  const candidate = String(result.stdout || '').trim();
  return candidate ? path.resolve(candidate) : null;
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function gitPathStatus(gitRoot, resolvedPath) {
  if (!gitRoot || !isPathInside(gitRoot, resolvedPath)) {
    return {
      inRepository: false,
      tracked: false,
      staged: false,
      ignored: false,
    };
  }

  const relativePath = path.relative(gitRoot, resolvedPath);
  const tracked = runGit(['ls-files', '-z', '--', relativePath], gitRoot);
  const staged = runGit(['diff', '--cached', '--name-only', '-z', '--', relativePath], gitRoot);
  const ignored = runGit(['check-ignore', '--quiet', '--', relativePath], gitRoot);

  return {
    inRepository: true,
    tracked: tracked.status === 0 && nulList(tracked.stdout).includes(relativePath),
    staged: staged.status === 0 && nulList(staged.stdout).includes(relativePath),
    ignored: ignored.status === 0,
  };
}

function addOwnerHeldGitBoundaryErrors(errors, inputIndex, pathStatus) {
  if (!pathStatus.inRepository) return;

  if (pathStatus.tracked) {
    errors.push(`Input ${inputIndex} points at a tracked repository file; use an owner-held file outside git or an ignored local proof path.`);
  }
  if (pathStatus.staged) {
    errors.push(`Input ${inputIndex} points at a staged repository file; unstage it and keep owner-held proof artifacts outside commits.`);
  }
  if (!pathStatus.ignored) {
    errors.push(`Input ${inputIndex} is inside the repository but is not ignored by git; move it outside the repo or under an explicitly ignored local proof path.`);
  }
}

function sameFileIdentity(leftStat, rightStat) {
  return leftStat.dev === rightStat.dev && leftStat.ino === rightStat.ino;
}

function sameFileSnapshot(leftStat, rightStat) {
  return (
    sameFileIdentity(leftStat, rightStat) &&
    leftStat.size === rightStat.size &&
    leftStat.mtimeMs === rightStat.mtimeMs &&
    leftStat.ctimeMs === rightStat.ctimeMs
  );
}

async function closeCheckedInputs(checkedInputs) {
  await Promise.all(
    checkedInputs
      .map((input) => input.fileHandle)
      .filter(Boolean)
      .map(async (fileHandle) => {
        try {
          await fileHandle.close();
        } catch {
          // Best-effort cleanup before emitting fail-closed JSON.
        }
      })
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg === '--help' || arg === '-h')) {
    process.stdout.write(`${usage}\n`);
    return;
  }

  const unknownOptions = args.filter((arg) => arg.startsWith('-') && !allowedOptions.has(arg));
  const inputPaths = args.filter((arg) => !arg.startsWith('-'));

  if (unknownOptions.length > 0) {
    fail(unknownOptions.map((option) => `Unsupported option: ${option}`));
    return;
  }

  if (inputPaths.length === 0) {
    fail(['Provide at least one local proof artifact path.']);
    return;
  }

  const checkedInputs = [];
  const errors = [];
  const gitRoot = currentGitRoot();

  for (const [index, inputPath] of inputPaths.entries()) {
    const inputIndex = index + 1;
    const resolvedPath = path.resolve(process.cwd(), inputPath);
    let fileHandle;
    try {
      const linkStat = await lstat(resolvedPath);
      if (linkStat.isSymbolicLink()) {
        errors.push(`Input ${inputIndex} is a symbolic link; use the real owner-held proof file path instead.`);
        continue;
      }
      if (!linkStat.isFile()) {
        errors.push(`Input ${inputIndex} is not a regular file.`);
        continue;
      }
      if (linkStat.nlink > 1) {
        errors.push(`Input ${inputIndex} has multiple filesystem links; copy it to a single-link owner-held proof file before hashing.`);
        continue;
      }

      const realPath = await realpath(resolvedPath);
      fileHandle = await open(resolvedPath, ownerProofOpenFlags);
      const openedStat = await fileHandle.stat();
      if (!openedStat.isFile()) {
        errors.push(`Input ${inputIndex} is not a regular file.`);
        continue;
      }
      if (openedStat.nlink > 1) {
        errors.push(`Input ${inputIndex} has multiple filesystem links; copy it to a single-link owner-held proof file before hashing.`);
        continue;
      }
      if (!sameFileIdentity(linkStat, openedStat)) {
        errors.push(`Input ${inputIndex} changed before it could be hashed; rerun with a stable owner-held proof file.`);
        continue;
      }

      const fileStat = await stat(realPath);
      if (!fileStat.isFile() || !sameFileIdentity(openedStat, fileStat)) {
        errors.push(`Input ${inputIndex} changed while resolving its canonical path; rerun with a stable owner-held proof file.`);
        continue;
      }
      const apparentPathStatus = gitPathStatus(gitRoot, resolvedPath);
      addOwnerHeldGitBoundaryErrors(errors, inputIndex, apparentPathStatus);
      const realPathStatus = realPath === resolvedPath ? apparentPathStatus : gitPathStatus(gitRoot, realPath);
      if (realPathStatus !== apparentPathStatus) {
        addOwnerHeldGitBoundaryErrors(errors, inputIndex, realPathStatus);
      }
      checkedInputs.push({
        inputIndex,
        resolvedPath,
        realPath,
        byteLength: openedStat.size,
        openedStat,
        fileHandle,
        pathStatus: realPathStatus,
      });
      fileHandle = null;
    } catch {
      errors.push(`Input ${inputIndex} is missing or unreadable.`);
    } finally {
      if (fileHandle) {
        await fileHandle.close();
      }
    }
  }

  if (errors.length > 0) {
    await closeCheckedInputs(checkedInputs);
    fail(errors);
    return;
  }

  const artifacts = [];
  for (const input of checkedInputs) {
    try {
      const proofArtifactHash = await sha256OpenFile(input.fileHandle);
      const finalStat = await input.fileHandle.stat();
      if (!sameFileSnapshot(input.openedStat, finalStat)) {
        errors.push(`Input ${input.inputIndex} changed while hashing; rerun with a stable owner-held proof file.`);
        continue;
      }

      artifacts.push({
        inputIndex: input.inputIndex,
        byteLength: input.byteLength,
        proofArtifactHash,
        sourcePathHash: sha256Text(input.realPath),
      });
    } finally {
      await input.fileHandle.close();
      input.fileHandle = null;
    }
  }

  if (errors.length > 0) {
    await closeCheckedInputs(checkedInputs);
    fail(errors);
    return;
  }

  printJson({
    ok: true,
    ...basePayload(),
    artifactCount: artifacts.length,
    artifacts,
    nextUse:
      'Copy only proofArtifactHash values into docs/commercialization/commercial-evidence-intake.local.json or docs/commercialization/manual-wcag-evidence.local.json. Keep this full output local unless path fingerprints and byte lengths are acceptable to share.',
  });
}

await main();
