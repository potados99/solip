# 새싹(saessak) 🌱

[소나무(sonamu)](https://github.com/ping-alive/sonamu)를 처음부터 이해할 수는 없어, 작은 새싹부터 시작하였습니다.

## 개요

아래 개념을 다루는 간단한 Express.js 서버입니다.

- 프로덕션에서는 빌드해서 실행, 개발할 때에는 TypeScript 직접 실행하고 HMR
- `swc`를 이용한 TypeScript 트랜스파일링
- CLI 명령
- yarn berry zero-install

## 실행

저장소를 클론한 뒤 다음을 실행해주세요.

```bash
$ yarn install
$ yarn build && yarn start
```

http://localhost:8080/model/mymodel

[mymodel.ts](./src/model/mymodel.ts)을 편집하고 웹 페이지를 새로고침하여 변화가 생기는지 봅니다.