import path from "path";
import { existsSync } from "fs";

export function findApiRootPath() {
  // NOTE: for support npm / yarn workspaces
  const workspacePath = process.env["INIT_CWD"];
  
  if (workspacePath && workspacePath.length !== 0) {
    return workspacePath;
  }

  // 분명 이 위치 즈음에서 require.main?.path ?? __dirname 같은 expression 때문에
  // dynohot이 쓰는 babel 플러그인이 TypeError: Property property of OptionalMemberExpression expected node to be of a type ["Identifier"] but instead got "CallExpression" 라고 뻗는 바람에
  // swc 출력을 es2015까지 낮춰서 성공하는 현상을 목격했는데,,, 이제는 재현이 안 됨...!
  // 그래서 swc 출력은 다시 esnext로 해둠.

  const basePath = import.meta.filename;
  let dir = path.dirname(basePath);
  if (dir.includes("/.yarn/")) {
    dir = dir.split("/.yarn/")[0];
  }
  do {
    if (existsSync(path.join(dir, "/package.json"))) {
      return dir.split(path.sep).join(path.sep);
    }
    dir = dir.split(path.sep).slice(0, -1).join(path.sep);
  } while (dir.split(path.sep).length > 1);
  
  throw new Error("프로젝트 루트 경로를 찾을 수 없습니다.");

  // import.meta.filename이 요따구로 나옴: /Users/potados/Projects/saessak/.yarn/__virtual__/saessak-virtual-053ce12b7d/1/packages/saessak/dist/utils/path-utils.js
  // 그래서 찾아봤자 /Users/potados/Projects/saessak 이런 식으로 나옴
  // 결국 이 경로에서는 실제 프로젝트 경로를 못 구함.
  // 그치만 workspace 환경이 아니면 작동할 것임!
}