# 새싹(saessak) 🌱

[소나무(sonamu)](https://github.com/cartanova-ai/sonamu)에 사용되는 개념과 기술을 이해하기 위해 만들어진 작은 프레임워크입니다.

## 개요

Saessak은 Sonamu와 같은 TypeScript 프레임워크입니다. 다만 일부 개념만 차용하여 이해를 돕는 목적으로 만들어졌습니다.

## Saessak이 Sonamu와 비슷한 점

Saessak은 아래 나열한 부분들에서 Sonamu와 비슷한 점이 있지만, 이들을 Sonamu와 다른 방식으로(훨씬 작게) 구현합니다.

- 사용자 프로젝트의 소스 코드를 가져와서 요청 처리에 사용하는 API 서버임.
- CLI를 통해 개발 및 빌드 명령을 제공함.
- TypeScript 직접 실행 및 소스코드 변경시 실시간으로 반영해주는 dev 서버를 제공함.
- Zero-install을 사용하여 의존성을 관리함.
- Workspace를 통해 monorepo에서 여러 프로젝트를 관리함.