import express from "express";
import Loader from "./loader";
import { Model } from "./types";
import http from "http";
import { findApiRootPath } from "./utils/path-utils";
import chalk from "chalk";

class SaessakClass {
  private server?: http.Server;

  private _apiRootPath: string | null = null;
  set apiRootPath(apiRootPath: string) {
    console.log(chalk.blue(`프로젝트 루트 경로가 설정되었습니다: ${apiRootPath}`));
    this._apiRootPath = apiRootPath;
  }
  get apiRootPath(): string {
    if (this._apiRootPath === null) {
      throw new Error("Saessak이 초기화되지 않았습니다.");
    }
    return this._apiRootPath!;
  }
  
  init() {
    console.log(chalk.green("Saessak을 초기화합니다."));

    this.apiRootPath = findApiRootPath();
  }

  async createServer(port: number = 8080) {
    const app = express();
    
    // src/model 디렉토리 아래에 있는 친구들은 동적으로 임포트해서 가져와 쓸 겁니다.
    const modelLoader = new Loader<Model>(`src/model`);

    // 처음에 한 번은 모두 당겨와줍니다.
    await modelLoader.load();

    app.get("/model/:name", (req, res) => {
      const { name } = req.params;

      // 요청이 오면 당겨놓은 모델을 불러와 처리합니다.
      const model = modelLoader.findModule(name);
      const result = model?.run();

      // 물론 없을 수도 있어요.
      res.send(result ?? `Model '${name}' not found.`);
    });

    this.server = app.listen(port, () => {
      console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
    });
  }

  async closeServer() {
    if (this.server) {
      this.server.close();
    }
  }
}

export const Saessak = new SaessakClass();
