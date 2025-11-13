import { Model } from "solip";
import libmodel from "./libmodel";

export default {
    run: () => `Hello World!! Using libmodel: ${libmodel.run()}`, // 여기 수정하시고 http://localhost:8080/model/mymodel 들어와보십셔.
} as Model;
