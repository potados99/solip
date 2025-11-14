import path from "path";
import { readdir } from "fs/promises";
import { pathToFileURL } from "url";
import { Saessak } from "./saessak";

/**
 * 주어진 경로에서 모듈을 긁어 import하고, 필요하다면 소스코드의 변경을 감지해 최신으로 유지해주는 친구입니다.
 *
 * 로드할 모듈의 타입은 T로 지정하고, 그 모듈들이 살고 있는 디렉토리는 modelDir로 지정합니다.
 */
export default class Loader<T> {
  constructor(private readonly modelDir: string) {}

  private modules: Record<string, T> = {};
  private modulesAcceptedPaths: Set<string> = new Set();

  /**
   * 주어진 모듈 경로들을 로드합니다.
   * 만약 주어지지 않으면 modelDir 아래에 있는 모듈들을 모두 로드합니다.
   */
  async load(modulePaths?: string[]) {
    const modelDirPath = path.join(
      Saessak.apiRootPath,
      this.modelDir
    ).replace("/src/", import.meta.hot ? "/src/" : "/dist/");

    const allModulePaths = (await readdir(modelDirPath))
      .filter((filename) => filename.endsWith(import.meta.hot ? ".ts" : ".js"))
      .map((filename) => path.join(modelDirPath, filename));
    const pathsToLoad = modulePaths ?? allModulePaths;

    for (const modulePath of pathsToLoad) {
      if (import.meta.hot) {
        if (this.modulesAcceptedPaths.has(modulePath)) {
          // 이미 최초 로드 + HMR 등록이 되어 있다면 넘어갑니다.
          continue;
        }
  
        // 일단 로드하고,
        await this.loadModule(modulePath);
  
        // 변경될 때 또 로드하게 해요.
        // dynohot은 file:// URL을 기대하므로 변환
        const moduleUrl = pathToFileURL(modulePath).href;
        import.meta.hot!.accept(moduleUrl, async () => {
          // 이 콜백은 이 모듈이 변경되었을 뿐만 아니라, 모듈이 의존하는 다른 친구가 변경되었을 때에도 호출됩니다.
          await this.loadModule(modulePath);
        });
  
        this.modulesAcceptedPaths.add(modulePath);
      } else {
        await this.loadModule(modulePath);
      }
    }
  }

  private async loadModule(modulePath: string) {
    // 캐시 버스팅 쿼리 파라미터 제거 (예: 'module?t=123' -> 'module')
    const cleanPath = modulePath.split("?")[0];

    console.log(`모듈 임포트합니다: ${cleanPath}`);
    // 절대 경로를 file:// URL로 변환
    const moduleUrl = pathToFileURL(modulePath).href;
    const module: T = (await import(moduleUrl)).default; // import는 URL 사용
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
