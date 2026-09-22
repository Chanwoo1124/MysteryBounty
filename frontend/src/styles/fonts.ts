/**
 * 글꼴을 앱에 함께 묶는다 (fontsource).
 *
 * 예전에는 index.html 에서 Google Fonts 를 받아 썼는데, 대회장 인터넷이 끊기면 글꼴이
 * 시스템 기본으로 떨어져 현황판 숫자 모양이 달라졌다. 이제 woff2 파일이 빌드에 포함되므로
 * 인터넷 없이도 시안 그대로 나온다.
 *
 * 화면에서 실제로 쓰는 굵기만 골라 넣는다 (tokens.css 의 --font / --font-kr 참고).
 * 서브셋도 필요한 것만 — Archivo 는 숫자·영문이라 latin, 본문 한글은 korean + latin.
 */

/* Archivo — 금액·영문 라벨. 기울임(italic)을 많이 써서 쌍으로 넣는다 */
import '@fontsource/archivo/latin-500.css';
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo/latin-600-italic.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/archivo/latin-700-italic.css';
import '@fontsource/archivo/latin-800.css';
import '@fontsource/archivo/latin-800-italic.css';
import '@fontsource/archivo/latin-900.css';
import '@fontsource/archivo/latin-900-italic.css';

/* Noto Sans KR — 한글 본문 (기울임 없음) */
import '@fontsource/noto-sans-kr/latin-400.css';
import '@fontsource/noto-sans-kr/korean-400.css';
import '@fontsource/noto-sans-kr/latin-500.css';
import '@fontsource/noto-sans-kr/korean-500.css';
import '@fontsource/noto-sans-kr/latin-700.css';
import '@fontsource/noto-sans-kr/korean-700.css';
import '@fontsource/noto-sans-kr/latin-900.css';
import '@fontsource/noto-sans-kr/korean-900.css';
