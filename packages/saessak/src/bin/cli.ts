import { tsicli } from "tsicli";
import chalk from "chalk";
import {
  BUILD_DIR,
  getSWCBuildCommand,
  TSC_DECLARATION_COMMAND,
} from "./build-config";
import { existsSync, rmSync } from "fs";
import { execSync, spawn } from "child_process";
import { exists } from "../utils/fs-utils";
import { Saessak } from "../core/saessak";

/**
 * Saessak CLI의 진입점입니다.
 */
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

/**
 * 사용자 프로젝트를 빌드합니다.
 */
async function build() {
  console.log(chalk.green("빌드를 시작합니다."));

  try {
    console.log(chalk.blue("빌드 결과물 디렉토리를 삭제합니다."));
    if (existsSync(BUILD_DIR)) {
      rmSync(BUILD_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(
      chalk.red("빌드 결과물 디렉토리 삭제에 실패하였습니다."),
      error
    );
    process.exit(1);
  }

  try {
    console.log(chalk.blue("SWC로 빌드를 시작합니다."));
    execSync(getSWCBuildCommand(Saessak.projectRootPath), {
      cwd: Saessak.projectRootPath,
      stdio: "inherit",
    });
  } catch (error) {
    console.error(chalk.red("빌드에 실패하였습니다."), error);
    process.exit(1);
  }

  try {
    console.log(chalk.blue("TSC로 선언맵을 생성합니다."));
    execSync(TSC_DECLARATION_COMMAND, {
      cwd: Saessak.projectRootPath,
      stdio: "inherit",
    });
  } catch (error) {
    console.error(chalk.red("선언맵 생성에 실패하였습니다."), error);
    process.exit(1);
  }

  console.log(chalk.green("빌드가 완료되었습니다."));
}

/**
 * 사용자 프로젝트의 빌드 결과물을 실행합니다.
 */
async function serve() {
  console.log(chalk.green("서버를 시작합니다."));

  const entryPoint = "dist/index.js";

  console.log(`다음 파일을 실행합니다: ${entryPoint}`);

  if (!(await exists(entryPoint))) {
    console.log(
      chalk.red(
        `${entryPoint} 파일이 존재하지 않습니다. 먼저 build를 실행해주세요.`
      )
    );
    process.exit(1);
  }

  spawn("node", ["-r", "source-map-support/register", entryPoint], {
    cwd: Saessak.projectRootPath,
    stdio: "inherit",
  });
}

/**
 * 사용자 프로젝트의 개발 서버를 시작합니다.
 */
async function dev() {
  console.log(chalk.green("개발 서버를 시작합니다."));

  const entryPoint = "src/index.ts";

  console.log(`다음 파일을 실행합니다: ${entryPoint}`);

  spawn(
    "node",
    [
      "--import",
      "@saessak-kit/loader",
      "--import",
      "dynohot",
      "--enable-source-maps",
      entryPoint,
    ],
    {
      cwd: Saessak.projectRootPath,
      stdio: "inherit",
    }
  );
}

main();
