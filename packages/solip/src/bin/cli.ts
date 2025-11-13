import { tsicli } from "tsicli";
import chalk from "chalk";
import { BUILD_DIR, getSWCBuildCommand } from "./build-config";
import { existsSync, rmSync } from "fs";
import { execSync } from "child_process";
import { NodemonSettings } from "nodemon";
import { exists } from "../utils/fs-utils";
import { readFile } from "fs/promises";
import path from "path";
import { Solip } from "../solip";

async function main() {
  Solip.init();
  
  await tsicli(process.argv, {
    types: {},
    args: [["build"], ["serve"], ["dev:serve"]],
    runners: {
      build,
      serve,
      "dev:serve": devServe,
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
    execSync(getSWCBuildCommand(Solip.apiRootPath), { cwd: Solip.apiRootPath, stdio: "inherit" });
  } catch (error) {
    console.error(chalk.red("빌드에 실패하였습니다."), error);
    process.exit(1);
  }
}

async function serve() {
  console.log(chalk.green("서버를 시작합니다."));

  const distIndexPath = path.join(Solip.apiRootPath, "dist", "index.js");

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
      cwd: Solip.apiRootPath,
      stdio: "inherit",
    }
  );

  process.on("SIGINT", () => {
    serverProcess.kill("SIGTERM");
    process.exit(0);
  });
}

async function devServe() {
  console.log(chalk.green("개발 서버를 시작합니다."));

  const nodemon = await import("nodemon");

  const nodemonConfig = await (async () => {
    const projectNodemonPath = path.join(Solip.apiRootPath, "nodemon.json");
    const hasProjectNodemon = await exists(projectNodemonPath);

    if (hasProjectNodemon) {
      return JSON.parse(await readFile(projectNodemonPath, "utf8"));
    }

    return {
      watch: ["src/index.ts"],
      ignore: ["dist/**", "**/*.js", "**/*.d.ts"],
      exec: [
        // SWC_BUILD_COMMAND,
        "node --no-warnings -r source-map-support/register --import dynohot --enable-source-maps dist/index.js",
      ].join(" && "),
    } as NodemonSettings;
  })();
  nodemon.default(nodemonConfig);

  // 프로세스 종료 처리
  const cleanup = async () => {
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("SIGUSR2", cleanup);
}

main();
