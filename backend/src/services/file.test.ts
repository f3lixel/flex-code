import { expect, test } from "bun:test";
import fs from "fs/promises";
import os from "os";
import path from "path";

import {
  getFileTree,
  getFileContentTree,
  writeFile,
  readFile,
  renameFile,
  removeFile,
} from "./file";

test("file operations without Docker", async () => {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "project-"));

  try {
    await writeFile(projectPath, "dir/sample.txt", "hello");
    const content = await readFile(projectPath, "dir/sample.txt");
    expect(content).toBe("hello");

    await renameFile(projectPath, "dir/sample.txt", "dir/renamed.txt");
    const renamed = await readFile(projectPath, "dir/renamed.txt");
    expect(renamed).toBe("hello");

    const tree = await getFileTree(projectPath);
    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe("dir");
    expect(tree[0].children?.[0].name).toBe("renamed.txt");

    const contentTree = await getFileContentTree(projectPath);
    const fileItem = contentTree[0].children?.[0];
    expect(fileItem?.content).toBe("hello");

    await removeFile(projectPath, "dir/renamed.txt");
    const treeAfter = await getFileTree(projectPath);
    expect(treeAfter[0].children?.length).toBe(0);
  } finally {
    await fs.rm(projectPath, { recursive: true, force: true });
  }
});
