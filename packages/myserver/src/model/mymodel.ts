import { Model } from "solip";
import libmodel from "./libmodel";

export default {
    run: () => {
        // 20% 확률로 throw해요
        if (Math.random() < 0.2) {
            throw new Error("Random error");
        }
        return `Hello World!! Using libmodel: ${libmodel.run()}`;
    }, // 여기 수정하시고 http://localhost:8080/model/mymodel 들어와보십셔.
} as Model;
