import { spawn, ChildProcess } from "child_process";
import fs from "fs/promises";
import path from "path";
import getPort from "get-port";

interface ProcessInfo {
  id: string;
  cwd: string;
  port: number;
  proc?: ChildProcess;
  status: "running" | "stopped";
  createdAt: string;
}

const processes = new Map<string, ProcessInfo>();
const BASE_DIR = path.join("/tmp", "process-apps");

async function runCommand(cmd: string, args: string[], cwd: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit" });
    child.on("exit", (code) => {
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

export async function createProcess(id: string): Promise<{ port: number }> {
  const cwd = path.join(BASE_DIR, id);
  await fs.mkdir(cwd, { recursive: true });

  // Clone template project
  await runCommand("git", [
    "clone",
    "https://github.com/ntegrals/december-nextjs-template.git",
    cwd,
  ], process.cwd());

  // Install dependencies
  await runCommand("pnpm", ["install"], cwd);

  const port = await getPort();
  const proc = spawn("pnpm", ["dev"], {
    cwd,
    env: { ...process.env, PORT: String(port) },
    stdio: "inherit",
  });

  processes.set(id, {
    id,
    cwd,
    port,
    proc,
    status: "running",
    createdAt: new Date().toISOString(),
  });

  proc.on("exit", () => {
    const info = processes.get(id);
    if (info) {
      info.status = "stopped";
      info.proc = undefined;
    }
  });

  return { port };
}

export async function startProcess(id: string): Promise<{ port: number }> {
  const info = processes.get(id);
  if (!info) throw new Error("Prozess nicht gefunden");
  if (info.status === "running" && info.proc) return { port: info.port };

  const port = await getPort();
  const proc = spawn("pnpm", ["dev"], {
    cwd: info.cwd,
    env: { ...process.env, PORT: String(port) },
    stdio: "inherit",
  });

  info.port = port;
  info.proc = proc;
  info.status = "running";

  proc.on("exit", () => {
    info.status = "stopped";
    info.proc = undefined;
  });

  return { port };
}

export async function stopProcess(id: string): Promise<void> {
  const info = processes.get(id);
  if (!info || !info.proc) throw new Error("Prozess nicht gefunden");
  info.proc.kill();
  info.status = "stopped";
  info.proc = undefined;
}

export async function deleteProcess(id: string): Promise<void> {
  const info = processes.get(id);
  if (!info) throw new Error("Prozess nicht gefunden");
  if (info.proc) {
    info.proc.kill();
  }
  await fs.rm(info.cwd, { recursive: true, force: true });
  processes.delete(id);
}

export function getProcessInfo(id: string): ProcessInfo | undefined {
  return processes.get(id);
}

export function getProjectPath(id: string): string | undefined {
  return processes.get(id)?.cwd;
}

export async function listProjectProcesses(): Promise<any[]> {
  const list: any[] = [];
  for (const info of processes.values()) {
    list.push({
      id: info.id,
      status: info.status,
      port: info.port,
      url: `http://localhost:${info.port}`,
      pid: info.proc?.pid,
      createdAt: info.createdAt,
    });
  }
  return list;
}
