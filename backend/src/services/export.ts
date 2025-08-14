import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import * as processService from "./process";

const execAsync = promisify(exec);

export async function exportContainerCode(id: string): Promise<Buffer> {
  const projectPath = processService.getProjectPath(id);
  if (!projectPath) throw new Error("Prozess nicht gefunden");

  const tempDir = `/tmp/export-${id}-${Date.now()}`;
  const zipPath = `${tempDir}.zip`;

  try {
    await execAsync("pnpm build", { cwd: projectPath });
    await fs.mkdir(tempDir, { recursive: true });
    await fs.cp(projectPath, tempDir, { recursive: true });

    await fs.rm(path.join(tempDir, "node_modules"), {
      recursive: true,
      force: true,
    });
    await fs.rm(path.join(tempDir, ".next"), {
      recursive: true,
      force: true,
    });

    await execAsync(`zip -r ${zipPath} . -x "*.DS_Store"`, { cwd: tempDir });
    const zipBuffer = await fs.readFile(zipPath);

    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(zipPath, { force: true });
    return zipBuffer;
  } catch (error) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.rm(zipPath, { force: true });
    } catch {}
    throw new Error(
      `Export fehlgeschlagen: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

