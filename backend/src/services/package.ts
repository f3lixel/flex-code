import { exec } from "child_process";
import { promisify } from "util";
import * as processService from "./process";

const execAsync = promisify(exec);

export async function addDependency(
  id: string,
  packageName: string,
  isDev: boolean = false
): Promise<string> {
  const cwd = processService.getProjectPath(id);
  if (!cwd) throw new Error("Prozess nicht gefunden");
  const devFlag = isDev ? "-D" : "";
  const cmd = `pnpm add ${packageName} ${devFlag}`.trim();
  const { stdout, stderr } = await execAsync(cmd, { cwd });
  return stdout || stderr;
}
