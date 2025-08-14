import fs from "fs/promises";
import path from "path";

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileItem[];
  content?: string;
}

export interface FileContentItem {
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  children?: FileContentItem[];
}

function resolvePath(projectPath: string, filePath: string): string {
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(projectPath, filePath);
}

async function walk(
  dir: string,
  includeContent: boolean
): Promise<(FileItem | FileContentItem)[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: (FileItem | FileContentItem)[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const children = await walk(fullPath, includeContent);
      results.push({
        name: entry.name,
        path: fullPath,
        type: "directory",
        children,
      });
    } else {
      const item: any = {
        name: entry.name,
        path: fullPath,
        type: "file",
      };
      if (includeContent) {
        item.content = await fs.readFile(fullPath, "utf8");
      }
      results.push(item);
    }
  }

  return results;
}

export async function getFileTree(projectPath: string): Promise<FileItem[]> {
  return (await walk(projectPath, false)) as FileItem[];
}

export async function getFileContentTree(
  projectPath: string
): Promise<FileContentItem[]> {
  return (await walk(projectPath, true)) as FileContentItem[];
}

export async function readFile(
  projectPath: string,
  filePath: string
): Promise<string> {
  const absolute = resolvePath(projectPath, filePath);
  const content = await fs.readFile(absolute, "utf8");
  return content.replace(/^\uFEFF/, "");
}

export async function listFiles(
  projectPath: string,
  dirPath: string = projectPath
): Promise<any[]> {
  const absolute = resolvePath(projectPath, dirPath);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(absolute, entry.name);
    const stat = await fs.stat(fullPath);
    results.push({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
      permissions: (stat.mode & 0o777).toString(8),
      size: stat.size.toString(),
      modified: stat.mtime.toISOString(),
    });
  }

  return results;
}

export async function writeFile(
  projectPath: string,
  filePath: string,
  content: string
): Promise<void> {
  const absolute = resolvePath(projectPath, filePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

export async function renameFile(
  projectPath: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  const absOld = resolvePath(projectPath, oldPath);
  const absNew = resolvePath(projectPath, newPath);
  await fs.mkdir(path.dirname(absNew), { recursive: true });
  await fs.rename(absOld, absNew);
}

export async function removeFile(
  projectPath: string,
  filePath: string
): Promise<void> {
  const absolute = resolvePath(projectPath, filePath);
  await fs.rm(absolute, { recursive: true, force: true });
}
