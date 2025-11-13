import { Solip } from "solip";

async function bootstrap() {
    Solip.init();
    await Solip.createServer(8080);
}

bootstrap();