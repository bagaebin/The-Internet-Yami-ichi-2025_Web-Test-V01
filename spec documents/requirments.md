# Requirements 1_1411_Hyebin
- **Intro page**가 윈도우 사이즈에 딱 맞아 스크롤바가 보이지 않도록 설정해주세요.
- **Intro page**에 들어간 로고들을(assets/logos/2025_yamiichi_logo.png 제외) 기존에 존재하는 card 스타일 칸 안에 넣어주세요 - 팝업 윈도우 스타일.
- **Intro page**에 들어간 로고들에(assets/logos/2025_yamiichi_logo.png 제외) 중앙에서 튀어나오는 초기 애니메이션이 끊겨보이는 오류를 해결하고 자연스럽게 한 번에 이동하도록 해주세요.
* **Intro page** 밖으로 로고들이 나가지 않도록 주의해주세요.

- **footer**에 아래 로고 이미지들을 넣어주세요.
* assets/logos/artez_logo.png
* assets/logos/dat_logo.png
* assets/logos/focus_logo.png

- 아래 스타일의 커스텀 스크롤바 css를 적용해주세요.
scrollbar-face-color:#05B7FF;
scrollbar-arrow-color:#05B7FF;
scrollbar-track-color:#CBD5D7;
scrollbar-shadow-color:#05B7FF;
scrollbar-highlight-color:#05B7FF;
scrollbar-3dlight-color:#808080;
scrollbar-darkshadow-Color:#202020;

# Requirements 2_2811_Hyebin
<공통> 아래 요청사항을 바탕으로 spec document를 먼저 업데이트를 하고, 이를 기반으로 실제 코드 패치를 진행해주세요.

- <문제 1> 현재는 세로형 화면일 때 **intro page**의 중앙 로고(2025_yamiichi_logo) 오른쪽으로 치우쳐 보입니다.
<해결 요청> 이 로고를 중앙에 맞도록 조정해주세요.

- <문제 2> **intro page**의 로고 팝업은 같은 시계 방향으로 돌고 있습니다.
<해결 요청> 반시계 방향으로 도는 로고 팝업도 만들어주세요.

- <문제 3> **intro page**의 로고 팝업은 세로형 화면에서 가려지는 중앙 로고로부터 충분히 떨어지지 못하고 겹쳐져 가려집니다.
<해결 요청> 겹치지 않도록 거리와 중앙 로고 크기를 화면 비율 및 크기에 따라 자동으로 조정해주세요.

- <문제 4> 현재는 chaos 모드(I Hate HTML)에 진입해서 카드를 드래그해 위치를 옮길 때, 다른 카드가 밀려나는 상황이 발생하기도 합니다.
<해결 요청> 이 원인을 분석하고 해당 현상이 발생하지 않도록 패치해주세요.

- <수정 1> **intro page**의 일시(logo-center__date)와 장소(텍스트 'FOCUS Arnhem')도 로고들과 같이 팝업에 넣어 중앙 로고 주위를 돌도록 해주세요.