import express from "express";
import Loader from "./loader";

async function bootstrap() {
    const app = express();

    // model 디렉토리 아래에 있는 친구들은 동적으로 임포트해서 가져와 쓸 겁니다.
    const modelLoader = new Loader<Model>("./model");

    // 처음에 한 번은 모두 당겨와줍니다.
    await modelLoader.load();

    // 그리고 실행 중에 소스코드 변경이 생기면 다시 당겨올 수 있도록 해줍니다.
    modelLoader.autoReload();

    app.get("/model/:name", (req, res) => {
        const { name } = req.params;

        // 요청이 오면 당겨놓은 모델을 불러와 처리합니다.
        const model = modelLoader.findModule(name);
        const result = model?.run();

        // 물론 없을 수도 있어요.
        res.send(result ?? `Model '${name}' not found.`);
    });

    app.listen(8080, () => {
        console.log("Server is running on port 8080");
    });
}

console.log("Hello World");

bootstrap();
