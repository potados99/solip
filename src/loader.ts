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
    constructor(private readonly moduleDir: string) { }

    private modules: Record<string, T> = {};

    /**
     * moduleDir 아래에 있는 모듈들(=TS 소스코드)에 변경이 생기면 다시 불러오도록 합니다.
     * 변경 감지 -> 트랜스파일 -> require 캐시 삭제 -> 임포트 순서입니다.
     */
    autoReload() {
        const whereToWatch = path.join(import.meta.filename.replace("/dist/", "/src/"), "..", this.moduleDir)

        console.log(`Watching ${whereToWatch}`);

        watch(whereToWatch)
            .on("change", async (modifiedPath) => {
                if (!modifiedPath.endsWith(".ts") || modifiedPath.endsWith(".d.ts")) {
                    return;
                }

                console.log(`\nChange detected at: ${modifiedPath}`);

                const { code, map } = await swc.transformFile(modifiedPath, {
                    // 이하 .swcrc 내용과 동일합니다.
                    "module": {
                        "type": "commonjs"
                    },
                    "jsc": {
                        "parser": {
                            "syntax": "typescript",
                            "decorators": true
                        },
                        "target": "es5"
                    },
                    "minify": true,
                    "sourceMaps": true
                });

                const transpiledPath = modifiedPath
                    .replace("/src/", "/dist/")
                    .replace(".ts", ".js");

                await mkdir(path.dirname(transpiledPath), { recursive: true });
                await writeFile(transpiledPath, code);

                console.log(`Transpiled to: ${transpiledPath}`);

                if (map) {
                    const mapPath = transpiledPath + ".map";
                    await mkdir(path.dirname(mapPath), { recursive: true });
                    await writeFile(mapPath, map);

                    const patchToAppend = "\n//# sourceMappingURL=" + path.basename(mapPath);
                    await writeFile(transpiledPath, patchToAppend, { flag: "a" });

                    console.log(`Added source mapping to: ${mapPath}`);
                }

                await this.load([transpiledPath]);
            });
    }

    /**
     * 주어진 모듈 경로들을 로드합니다.
     * 만약 주어지지 않으면 moduleDir 아래에 있는 모듈들을 모두 로드합니다.
     * 
     * 이미 로드된 모듈들은 삭제되어(this.modules 초기화), findModule에서 가져올 수 없게 됩니다.
     */
    async load(modulePaths?: string[]) {
        this.modules = {};

        const moduleDirPath = path.join(import.meta.filename, "..", this.moduleDir);
        const allModulePaths = (await readdir(moduleDirPath))
            .filter((filename) => filename.endsWith(".js"))
            .map((filename) => path.join(moduleDirPath, filename));
        const pathsToLoad = modulePaths ?? allModulePaths;

        for (const modulePath of pathsToLoad) {
            console.log(`Deleting cache for: ${modulePath}`);
            delete require.cache[require.resolve(modulePath)];

            console.log(`Importing module: ${modulePath}`);
            const module: T = (await import(modulePath)).default;
            const moduleName = path.basename(modulePath).replace(/\.[^/.]+$/, "");

            this.modules[moduleName] = module;

            console.log(`Loaded module: ${moduleName}`);
        }
    }

    /**
     * 주어진 모듈 이름으로 모듈을 찾습니다.
     * 얘가 가져오는 모듈은 load에서 로드한 모듈들 중 하나입니다.
     */
    findModule(name: string): T | undefined {
        return this.modules[name];
    }
}