import { Saessak } from "saessak";

async function bootstrap() {
    Saessak.init();
    await Saessak.createServer(8080);
}

bootstrap();