# saessak

Saessak은 Sonamu의 빌드/런타임 동작에 대한 이해를 돕기 위해 연습용으로 만들어진, 아주 작은 TypeScript API 서버 프레임워크입니다. 

Vite과 유사하게, TypeScript HMR 개발 서버를 지원합니다.

## [예제 프로젝트](../myserver/README.md)

## Saessak이 실제로 하는 일

### CLI

Saessak은 `saessak dev`, `saessak build`, `saessak serve` 명령을 제공합니다. 아래는 이러한 명령들이 실제로 정의되고 사용되는 방식에 대한 설명입니다.

- `yarn dev`를 실행하면 실제로는 `saessak dev` 명령이 실행됩니다. 이렇게 `${패키지명} ${명령어...}` 형태로 실행을 하면 해당 패키지(`saessak`)의 [package.json](./package.json) 속 `bin` 필드에 명시된 파일이 `${명령어...}` 인자와 함께 실행됩니다. 
- Saessak의 경우 `bin` 필드에 명시된 파일은 `dist/bin/cli.js` 파일입니다. 이 파일은 [src/bin/cli.ts](./src/bin/cli.ts) 파일을 빌드한 결과물입니다.
- [src/bin/cli.ts](./src/bin/cli.ts) 파일은 `tsicli` 라이브러리를 사용하여 CLI 명령을 정의합니다. `tsicli` 함수 호출의 두 번째 인자로 넘긴 설정 객체의 `runners` 필드에 실제로 실행될 함수들이 명시되어 있습니다.
- 가령 `yarn dev`를 실행하면 `saessak dev`가 실행되고, 이는 `dist/bin/cli.js`를 실행시켜 그 안에 정의된 `dev` 함수를 호출하게 됩니다.

여기서 중요한 점이 있습니다. 이 `dist/bin/cli.js` 파일은 실제로는 이 프레임워크를 *사용*하는 프로젝트의 맥락에서 실행된다는 것입니다. `myserver` 프로젝트를 예시로 들어보겠습니다. 
- 이 CLI로 실행하는 `build`는 `saessak`이 아닌 `myserver` 프로젝트의 소스 코드를 빌드하는 동작이며,
- `serve` 또한 그렇게 만들어진 `myserver` 프로젝트의 빌드 결과물(`dist`)을 실행하는 동작입니다. 
- 역시나 `dev` 또한 이 `myserver` 프로젝트의 소스 코드를 실시간으로 트랜스파일링하여 실행하는 동작입니다.

### 빌드와 트랜스파일링

아래는 Saessak이 실제로 처리하는 `build`, `serve`와 `dev` 명령의 동작에 대한 설명입니다.

- `build` 명령은 먼저 `dist` 디렉토리를 삭제하고, 그 다음 SWC를 사용하여 소스 코드를 트랜스파일한 다음, 마지막으로 TSC를 사용하여 선언맵을 생성합니다.
- `serve` 명령은 `dist` 디렉토리에 있는 `index.js` 파일을 `node`로 실행합니다. 이 파일은 `build` 명령을 통해 만들어진 결과물입니다. 따라서 `serve` 전에 `build` 명령을 먼저 실행해야 합니다.
- `dev` 명령은 `src/index.ts` 파일을 빌드 없이 `node`로 직접 실행합니다. 기본적으로 `node`는 TypeScript를 직접 실행할 수가 없고, HMR도 제공하지 않습니다. 따라서 TypeScript를 직접 로드할 수 있도록 `--import @saessak-kit/loader` 옵션을 붙이며, 개발 중에 코드가 변경된 모듈들을 서버 재시작 없이 실시간으로 다시 불러올 수 있도록(=HMR) `--import dynohot` 옵션도 추가합니다.

### API 서버 실행

Saessak은 간단한 API 서버를 띄워줍니다.

- Saessak의 API 서버는 요청을 처리하기 위해 사용자 프로젝트가 `src/model` 디렉토리 아래에 구현한 모델 파일들을 동적으로 import하여 사용합니다.
- 사용자 프로젝트가 `src/model` 디렉토리 아래에 모델 파일들을 구현하면, Saessak은 이를 `readdir`로 찾아서 동적으로 import합니다.
- 이렇게 import된 모델(=실제로는 단순한 자바스크립트 함수)들은 메모리에 저장해 두었다가, `/model/:name` 경로로 요청이 수신되었을 때 `:name`에 해당하는 파일명을 가진 모델을 찾아서 실행하고, 그 결과를 응답합니다.
