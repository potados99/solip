import path from "path";
import fs from "fs/promises";

/**
 * 주어진 경로에 존재하는 모듈을 긁어와서 동적으로 로드합니다.
 * 그렇게 로드한 모듈은 이름(파일명에서 확장자 제거)으로 접근할 수 있습니다.
 */
export default class Loader<T> {
    constructor(private readonly modelDir: string) { }

    private modules: Record<string, T> = {};

    async load() {
        this.modules = {};

        const moduleDirPath = path.join(import.meta.filename, "..", this.modelDir);
        const moduleFilenames = (await fs.readdir(moduleDirPath))
            .filter((filename) => filename.endsWith(".js"));

        for (const modelFilename of moduleFilenames) {
            const moduleFilePath = path.join(moduleDirPath, modelFilename);
            const module: T = (await import(moduleFilePath)).default;
            const moduleNameWithoutExtension = modelFilename.replace(/\.[^/.]+$/, "");

            this.modules[moduleNameWithoutExtension] = module;

            console.log(`Loaded module: ${moduleNameWithoutExtension}`);
        }

    }

    findModule(name: string): T | undefined {
        return this.modules[name];
    }
}