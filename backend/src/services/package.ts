import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function addDependency(
  projectPath: string,
  packageName: string,
  isDev: boolean = false
): Promise<string> {
  const devFlag = isDev ? "--save-dev" : "";
  const addCommand = `pnpm add ${packageName} ${devFlag}`.trim();
  const { stdout, stderr } = await execAsync(addCommand, { cwd: projectPath });
  return stdout || stderr;
}

export async function buildProject(projectPath: string): Promise<string> {
  const { stdout, stderr } = await execAsync("pnpm build", { cwd: projectPath });
  return stdout || stderr;
}
