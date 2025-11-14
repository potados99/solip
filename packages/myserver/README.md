# myserver

이 프로젝트는 Saessak 프레임워크를 사용하여 작성된 간단한 서버입니다.

## 실행

```bash
$ yarn install
$ yarn workspace saessak build # Saessak 프레임워크를 빌드합니다. 최초 한 번 해주시면 됩니다.
$ yarn dev # 개발 서버 실행 (개발하실 때 쓰시면 좋습니다)
$ yarn build && yarn start # 빌드 후 실행 (프로덕션에서 쓰시면 좋습니다)
```

`http://localhost:8080/model/mymodel` 에 접속한 다음, `src/model/mymodel.ts` 파일을 수정해보세요.

## 프로젝트 구조

```
myserver/
├── src/                 # 프로젝트 소스 코드 (꼭 "src" 디렉토리 이름이어야 합니다)
│   ├── index.ts         # 엔트리 포인트 (꼭 "index.ts" 파일 이름이어야 합니다)
│   ├── model/           # 모듈 디렉토리 (꼭 "model" 디렉토리 이름이어야 합니다)
│   │   ├── mymodel.ts
│   │   └── libmodel.ts
├── package.json
├── tsconfig.json
└── README.md
```

이 프로젝트 구조는 Saessak 프레임워크를 사용하는 프로젝트의 기본 구조입니다.

## 동작

- `src/index.ts`에서 `Saessak.createServer()`를 사용하여 서버를 시작하고 나면, `src/model` 디렉토리 아래에 있는 모듈들이 동적으로 로드되어 실행됩니다.
- `src/model` 디렉토리 아래에 있는 모듈들은 `yarn dev`로 실행시 HMR의 대상이 됩니다.
- `src/model` 아래에 있는 모듈들은 `http://localhost:8080/model/:name` 경로로 GET 요청을 받으면 실행됩니다. `:name` 부분은 `src/model` 디렉토리 아래에 있는 모듈 파일 이름입니다.
