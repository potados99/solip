import express from "express";
import Loader from "./loader";

async function bootstrap() {
    const app = express();

    const loader = new Loader<Model>("./model");
    await loader.load();

    app.get("/model/:name", (req, res) => {
        const { name } = req.params;
        const model = loader.findModule(name);
        res.send(model?.run() ?? `Model '${name}' not found.`);
    });

    app.listen(8080, () => {
        console.log("Server is running on port 8080");
    });
}

console.log("Hello World");

bootstrap();
