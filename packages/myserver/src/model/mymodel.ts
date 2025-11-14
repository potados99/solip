import { Model } from "saessak";
import libmodel from "./libmodel";

export default {
    run: () => {
        // 20% 확률로 throw해요
        if (Math.random() < 0.2) {
            throw new Error("당황하지 마십시오! 20% 확률로 발생하는 에러입니다. 스택 트레이스를 확인하기 위한 목적입니다.");
        }
        return `Hello World!! Using libmodel: ${libmodel.run()}`;
    }, // 여기 수정하시고 http://localhost:8080/model/mymodel 들어와보십셔.
} as Model;
