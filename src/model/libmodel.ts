import { Model } from "../types";

const now = new Date().toISOString();

export default {
    run: () => `libmodel at ${now}` // 여기 수정하시고 http://localhost:8080/model/mymodel 들어와보십셔.
} as Model;
