import { exec } from "child_process";
import { promisify } from "util";
import * as processService from "./process";

const execAsync = promisify(exec);

function getCwd(id: string): string {
  const cwd = processService.getProjectPath(id);
  if (!cwd) throw new Error("Prozess nicht gefunden");
  return cwd;
}

export async function addDependency(
  id: string,
  packageName: string,
  isDev: boolean = false
): Promise<string> {
  const cwd = getCwd(id);
  const devFlag = isDev ? "--save-dev" : "";
  const cmd = `pnpm add ${packageName} ${devFlag}`.trim();
  const { stdout, stderr } = await execAsync(cmd, { cwd });
  return stdout || stderr;
}

export async function buildProject(id: string): Promise<string> {
  const cwd = getCwd(id);
  const { stdout, stderr } = await execAsync("pnpm build", { cwd });
  return stdout || stderr;
}

