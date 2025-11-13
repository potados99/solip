/**
 * 빌드 결과물이 담길 디렉토리 경로
 */
export const BUILD_DIR = "dist";

/**
 * SWC 빌드 명령어
 */
export const getSWCBuildCommand = (
  apiRootPath: string
) => `swc src -d ${BUILD_DIR} \
--strip-leading-paths \
-C module.type=es6 \
-C module.resolveFully=true \
-C jsc.parser.syntax=typescript \
-C jsc.parser.decorators=true \
-C jsc.baseUrl=${apiRootPath} \
-C jsc.target=esnext \
-C minify=false \
-C sourceMaps=true`;

/**
 * TSC 타입 체크 명령어
 */
export const TSC_TYPE_CHECK_COMMAND = `tsc --noEmit`;
