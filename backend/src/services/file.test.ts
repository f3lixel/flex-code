import { expect, test, mock } from "bun:test";
import fs from "fs/promises";
import os from "os";
import path from "path";

test("file operations without Docker", async () => {
  const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "project-"));
  const id = "test-id";

  mock.module("./process", () => ({
    getProjectPath: () => projectPath,
  }));

  const {
    getFileTree,
    getFileContentTree,
    writeFile,
    readFile,
    renameFile,
    removeFile,
  } = await import("./file");

  try {
    await writeFile(id, "dir/sample.txt", "hello");
    const content = await readFile(id, "dir/sample.txt");
    expect(content).toBe("hello");

    await renameFile(id, "dir/sample.txt", "dir/renamed.txt");
    const renamed = await readFile(id, "dir/renamed.txt");
    expect(renamed).toBe("hello");

    const tree = await getFileTree(id);
    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe("dir");
    expect(tree[0].children?.[0].name).toBe("renamed.txt");

    const contentTree = await getFileContentTree(id);
    const fileItem = contentTree[0].children?.[0];
    expect(fileItem?.content).toBe("hello");

    await removeFile(id, "dir/renamed.txt");
    const treeAfter = await getFileTree(id);
    expect(treeAfter[0].children?.length).toBe(0);
  } finally {
    mock.restore();
    await fs.rm(projectPath, { recursive: true, force: true });
  }
});
