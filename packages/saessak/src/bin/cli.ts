import { tsicli } from "tsicli";
import chalk from "chalk";
import { BUILD_DIR, getSWCBuildCommand, TSC_DECLARATION_COMMAND } from "./build-config";
import { existsSync, rmSync } from "fs";
import { execSync } from "child_process";
import { exists } from "../utils/fs-utils";
import path from "path";
import { Saessak } from "../saessak";

async function main() {
  Saessak.init();
  
  await tsicli(process.argv, {
    types: {},
    args: [["build"], ["serve"], ["dev"]],
    runners: {
      build,
      serve,
      dev,
    },
  });
}

async function build() {
  console.log(chalk.green("빌드를 시작합니다."));

  try {
    console.log(chalk.blue("빌드 결과물 디렉토리를 삭제합니다."));
    if (existsSync(BUILD_DIR)) {
      rmSync(BUILD_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(chalk.red("빌드 결과물 디렉토리 삭제에 실패하였습니다."), error);
    process.exit(1);
  }

  try {
    console.log(chalk.blue("SWC로 빌드를 시작합니다."));
    execSync(getSWCBuildCommand(Saessak.apiRootPath), { cwd: Saessak.apiRootPath, stdio: "inherit" });
    console.log(chalk.blue("TSC로 선언맵을 생성합니다."));
    execSync(TSC_DECLARATION_COMMAND, { cwd: Saessak.apiRootPath, stdio: "inherit" });
  } catch (error) {
    console.error(chalk.red("빌드에 실패하였습니다."), error);
    process.exit(1);
  }

  console.log(chalk.green("빌드가 완료되었습니다."));
}

async function serve() {
  console.log(chalk.green("서버를 시작합니다."));

  const distIndexPath = path.join(Saessak.apiRootPath, "dist", "index.js");

  console.log(`다음 파일을 실행합니다: ${distIndexPath}`);

  if (!(await exists(distIndexPath))) {
    console.log(
      chalk.red("dist/index.js not found. Please build your project first.")
    );
    console.log(chalk.blue("Run: yarn sonamu build"));
    return;
  }

  const { spawn } = await import("child_process");
  const serverProcess = spawn(
    "node",
    ["-r", "source-map-support/register", distIndexPath],
    {
      cwd: Saessak.apiRootPath,
      stdio: "inherit",
    }
  );

  process.on("SIGINT", () => {
    serverProcess.kill("SIGTERM");
    process.exit(0);
  });
}

async function dev() {
  console.log(chalk.green("개발 서버를 시작합니다."));

  const entryPoint = "src/index.ts";

  console.log(`다음 파일을 실행합니다: ${entryPoint}`);

  const { spawn } = await import("child_process");
  const serverProcess = spawn(
    "node",
    ["--import", "@saessak-kit/loader", "--import", "dynohot", "--enable-source-maps", entryPoint],
    {
      cwd: Saessak.apiRootPath,
      stdio: "inherit",
    }
  );

  process.on("SIGINT", () => {
    serverProcess.kill("SIGTERM");
    process.exit(0);
  });
}

main();
