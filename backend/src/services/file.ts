import fs from "fs/promises";
import path from "path";
import * as processService from "./process";

const IGNORED = ["node_modules", ".next"];

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

function getBasePath(id: string): string {
  const cwd = processService.getProjectPath(id);
  if (!cwd) throw new Error("Prozess nicht gefunden");
  return cwd;
}

export async function listFiles(
  id: string,
  dir: string = "."
): Promise<any[]> {
  const abs = path.join(getBasePath(id), dir);
  const entries = await fs.readdir(abs, { withFileTypes: true });
  const result: any[] = [];
  for (const entry of entries) {
    if (IGNORED.includes(entry.name)) continue;
    const stat = await fs.stat(path.join(abs, entry.name));
    result.push({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  }
  return result;
}

async function walk(dir: string): Promise<FileItem[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const items: FileItem[] = [];
  for (const entry of entries) {
    if (IGNORED.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      items.push({
        name: entry.name,
        path: full,
        type: "directory",
        children: await walk(full),
      });
    } else {
      items.push({ name: entry.name, path: full, type: "file" });
    }
  }
  return items;
}

export async function getFileTree(
  id: string,
  dir: string = "."
): Promise<FileItem[]> {
  const abs = path.join(getBasePath(id), dir);
  return await walk(abs);
}

async function walkWithContent(dir: string): Promise<FileContentItem[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const items: FileContentItem[] = [];
  for (const entry of entries) {
    if (IGNORED.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      items.push({
        name: entry.name,
        path: full,
        type: "directory",
        children: await walkWithContent(full),
      });
    } else {
      const content = await fs.readFile(full, "utf8");
      items.push({ name: entry.name, path: full, type: "file", content });
    }
  }
  return items;
}

export async function getFileContentTree(
  id: string,
  dir: string = "."
): Promise<FileContentItem[]> {
  const abs = path.join(getBasePath(id), dir);
  return await walkWithContent(abs);
}

export async function readFile(
  id: string,
  filePath: string
): Promise<string> {
  const abs = path.join(getBasePath(id), filePath);
  const content = await fs.readFile(abs, "utf8");
  return content.replace(/^\uFEFF/, "");
}

export async function writeFile(
  id: string,
  filePath: string,
  content: string
): Promise<void> {
  const abs = path.join(getBasePath(id), filePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

export async function renameFile(
  id: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  const absOld = path.join(getBasePath(id), oldPath);
  const absNew = path.join(getBasePath(id), newPath);
  await fs.mkdir(path.dirname(absNew), { recursive: true });
  await fs.rename(absOld, absNew);
}

export async function removeFile(
  id: string,
  filePath: string
): Promise<void> {
  const abs = path.join(getBasePath(id), filePath);
  await fs.rm(abs, { recursive: true, force: true });
}

