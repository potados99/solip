# 새싹(saessak) 🌱

[소나무(sonamu)](https://github.com/ping-alive/sonamu)를 처음부터 이해할 수는 없어, 작은 새싹부터 시작하였습니다.

## 개요

아래 개념을 다루는 간단한 Express.js 서버입니다.

- 빌드 과정과 dist 디렉토리 없이 바로 실행 및 HMR을 지원하는 런타임
- 커스텀 로더를 사용한 import 경로 해석과 즉각적 swc 트랜스파일링
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