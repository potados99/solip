import path from "path";
import { readdir, mkdir, writeFile } from "fs/promises";
import { watch } from "chokidar";
import * as swc from "@swc/core";

/**
 * 주어진 경로에서 모듈을 긁어 import하고, 필요하다면 소스코드의 변경을 감지해 최신으로 유지해주는 친구입니다.
 *
 * 로드할 모듈의 타입은 T로 지정하고, 그 모듈들이 살고 있는 디렉토리는 moduleDir로 지정합니다.
 */
export default class Loader<T> {
  constructor(private readonly moduleDir: string) {}

  private modules: Record<string, T> = {};
  private modulesAcceptedPaths: Set<string> = new Set();

  /**
   * moduleDir 아래에 있는 모듈들(=TS 소스코드)에 변경이 생기면 다시 불러오도록 합니다.
   * 변경 감지 -> 트랜스파일 -> require 캐시 삭제 -> 임포트 순서입니다.
   */
  autoReload() {
    const whereToWatch = path.join(
      import.meta.filename.replace("/dist/", "/src/"),
      "..",
      this.moduleDir
    );

    console.log(`다음 경로의 파일 변경을 감지합니다: ${whereToWatch}`);

    watch(whereToWatch).on("change", async (modifiedPath) => {
      if (!modifiedPath.endsWith(".ts") || modifiedPath.endsWith(".d.ts")) {
        return;
      }

      console.log(`\n파일 변경 감지: ${modifiedPath}`);

      const { code, map } = await swc.transformFile(modifiedPath, {
        // 이하 .swcrc 내용과 동일합니다.
        module: {
          type: "es6", // import/export 쓰는 esm으로 가겠습니다.
          resolveFully: true, // esm이 요구하는 대로, 임포트 경로를 실제 파일 경로(확장자 포함)로 풀어줍니다.
        },
        jsc: {
          parser: {
            syntax: "typescript",
            decorators: true,
          },
          // 여기에서는 baseUrl을 "."로 지정하면 절대경로 내놓으라고 난리칩니다. 그래서 뺐는데 resolveFully 잘 작동해요.
          target: "esnext", // 타겟은 그냥 최신 문법으로.
        },
        minify: false, // 어차피 용량 10%정도 차이밖에 안 남. minify를 끄면 혹시 혹시 정말 혹시나 나중에 소스맵 없이 코드를 봐야 하는 끔찍한 상황에 조금이나마 도움이 될 수 있지 않을까 해서 끔.
        sourceMaps: true, // 소스맵 생성. 선언맵은 밖에서 tsc로 따로 만들거예요.
      });

      const transpiledPath = modifiedPath
        .replace("/src/", "/dist/")
        .replace(".ts", ".js");

      await mkdir(path.dirname(transpiledPath), { recursive: true });
      await writeFile(transpiledPath, code);

      console.log(`트랜스파일 완료: ${transpiledPath}`);

      if (map) {
        const mapPath = transpiledPath + ".map";
        await mkdir(path.dirname(mapPath), { recursive: true });
        await writeFile(mapPath, map);

        const patchToAppend =
          "\n//# sourceMappingURL=" + path.basename(mapPath);
        await writeFile(transpiledPath, patchToAppend, { flag: "a" });

        console.log(`소스맵 추가 완료: ${mapPath}`);
      }

      await this.load([transpiledPath]);
    });
  }

  /**
   * 주어진 모듈 경로들을 로드합니다.
   * 만약 주어지지 않으면 moduleDir 아래에 있는 모듈들을 모두 로드합니다.
   */
  async load(modulePaths?: string[]) {
    if (!import.meta.hot) {
      throw new Error("dynohot is not active! you must run node with --import dynohot flag.");
    }

    const moduleDirPath = path.join(import.meta.filename, "..", this.moduleDir);
    const allModulePaths = (await readdir(moduleDirPath))
      .filter((filename) => filename.endsWith(".js"))
      .map((filename) => path.join(moduleDirPath, filename));
    const pathsToLoad = modulePaths ?? allModulePaths;

    for (const modulePath of pathsToLoad) {
      if (this.modulesAcceptedPaths.has(modulePath)) {
        // 이미 최초 로드 + HMR 등록이 되어 있다면 넘어갑니다.
        continue;
      }

      // 일단 로드하고,
      await this.loadModule(modulePath);

      // 변경될 때 또 로드하게 해요.
      import.meta.hot!.accept(modulePath, async () => {
        // 이 콜백은 이 모듈이 변경되었을 뿐만 아니라, 모듈이 의존하는 다른 친구가 변경되었을 때에도 호출됩니다.
        await this.loadModule(modulePath);
      });

      this.modulesAcceptedPaths.add(modulePath);
    }
  }

  private async loadModule(modulePath: string) {
    // 캐시 버스팅 쿼리 파라미터 제거 (예: 'module?t=123' -> 'module')
    const cleanPath = modulePath.split("?")[0];

    console.log(`모듈 임포트합니다: ${cleanPath}`);
    const module: T = (await import(modulePath)).default; // import는 원본 경로 사용 (캐시 버스팅 유지)
    const moduleName = path.basename(cleanPath).replace(/\.[^/.]+$/, "");

    this.modules[moduleName] = module;
  }

  /**
   * 주어진 모듈 이름으로 모듈을 찾습니다.
   * 얘가 가져오는 모듈은 load에서 로드한 모듈들 중 하나입니다.
   */
  findModule(name: string): T | undefined {
    return this.modules[name];
  }
}
