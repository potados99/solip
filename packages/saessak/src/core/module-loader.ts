import path from "path";
import { readdir } from "fs/promises";
import { pathToFileURL } from "url";
import { Saessak } from "./saessak";

/**
 * 주어진 경로에서 모듈을 긁어 import하고, 필요하다면 소스코드의 변경을 감지해 최신으로 유지해주는 친구입니다.
 *
 * 로드할 모듈의 타입은 T로 지정하고, 그 모듈들이 살고 있는 디렉토리는 moduleDir로 지정합니다.
 */
export default class ModuleLoader<T> {
  constructor(private readonly moduleDir: string) {}

  private modules: Record<string, T> = {};
  private modulesAcceptedPaths: Set<string> = new Set();

  /**
   * moduleDir 아래에 있는 모듈들을 모두 로드합니다.
   * 이렇게 로드된 모듈들은 (지원되는 경우) HMR의 대상이 됩니다.
   */
  async load() {
    // 프로젝트의 특정 디렉토리(moduleDir) 아래에 있는 실제 소스코드 파일들을 로드(import)해야 합니다.
    // 만약 프로젝트가 현재 개발 모드로 실행되어 HMR이 지원되는 상태라면, src 디렉토리 아래에서 .ts 파일들을 바로 읽어옵니다.
    // 그러나 만약 프로젝트가 빌드된 dist에서 실행되고 있다면 dist 디렉토리 아래에서 .js 파일들을 읽어옵니다.
    //
    // 이를 하나의 경로로 맞출 수가 없었습니다. 
    // 이 부분은 로더나 트랜스파일러가 어찌 도와줄 수 없는, 프레임워크의 소스 코드가 직접 처리하는 동적 임포트 구문인지라,
    // 상황(개발 모드인지 빌드 모드인지)에 따라 다른 경로를 사용해야 합니다.
    const moduleDirPath = path.join(
      Saessak.projectRootPath, // 절대경로일 것으로 상정합니다.
      this.moduleDir
    ).replace("/src/", import.meta.hot ? "/src/" : "/dist/");
    const allModulePaths = (await readdir(moduleDirPath))
      .filter((filename) => filename.endsWith(import.meta.hot ? ".ts" : ".js"))
      .map((filename) => path.join(moduleDirPath, filename));

    for (const modulePath of allModulePaths) {
      if (import.meta.hot) {
        // HMR이 가능한 상태라면, 모듈을 로드함과 더불어 해당 모듈 변경시 자동으로 다시 로드되도록 콜백을 등록합니다.
        if (this.modulesAcceptedPaths.has(modulePath)) {
          // 이미 최초 로드 + HMR 등록이 되어 있다면 넘어갑니다.
          continue;
        }
  
        // esm은 절대경로("/something/like/this.ts")로 import할 수 없습니다. 
        // 상대경로("./something/like/this.ts")는 가능합니다.
        // 절대경로를 쓰려면 아래와 같이 file:// URL로 변환해야 합니다.
        const moduleUrlString = pathToFileURL(modulePath).href;

        // 일단 로드합니다.
        await this.loadModule(moduleUrlString);
  
        // 변경될 때 또 로드하도록 콜백을 등록합니다.
        import.meta.hot!.accept(moduleUrlString, async () => {
          // 이 콜백은 이 모듈이 변경되었을 뿐만 아니라, 모듈이 의존하는 다른 친구가 변경되었을 때에도 호출됩니다.
          await this.loadModule(moduleUrlString);
        });
  
        this.modulesAcceptedPaths.add(modulePath);
      } else {
        // HMR이 불가능한 상태라면, 그냥 모듈을 로드하고 끝입니다.
        await this.loadModule(modulePath);
      }
    }
  }

  private async loadModule(moduleUrlString: string) {
    console.log(`모듈을 임포트합니다: ${moduleUrlString}`);

    const module: T = (await import(moduleUrlString)).default;
    const moduleName = path.basename(moduleUrlString).replace(/\.[^/.]+$/, "");

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
