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


# Requirements 3_2811_Hyebin
- <수정 1> **card**의 artist 이름이 들어가는 텍스트(예: '
Marijke Goeting', 'My Pony Little', 'Lucia Siles
'...)의 글씨를 12px로 지정해주세요. 필요한 경우 새로운 css 스타일을 만들어주세요.

- <수정 2> 로고 이미지를 클릭하면 새 탭으로 지정한 링크가 열리도록 해주세요. 이미지와 링크는 아래 조합 목록을 확인해주세요.
* artez_logo.png - https://www.artez.nl/en/
* dat_logo.png - https://www.instagram.com/dat.artez.nl/
* focus_logo.png - https://www.focusarnhem.nl
* og_yamiichi_logo.png - http://yami-ichi.biz

- <수정 3> favicon을 'yamiichi_25.ico'로 변경해주세요.


# Requirements 4_0512_Hyebin
- **card(card bevel card--event)**에 이미지가 들어갈 수 있는 갤러리 영역을 만들어주세요. 스타일은 아래를 참고해주세요.
* 설명 텍스트(card-text card-text--small)와 갤러리 영역이 가로로 2열 배치하는 레이아웃입니다.
* 설명 텍스트와 갤러리 영역의 가로 영역은 동일하게 설정해주세요.
* 갤러리 영역을 가진 카드는 최대 너비가 기존의 2배로 설정되어 2열 배치를 위한 공간을 확보합니다.
* 갤러리 영역에 여러 개의 이미지가 들어갈 경우, 내부에 세로 스크롤을 만들어 스크롤을 내리면 다음 이미지를 볼 수 있습니다.

- **'I HATE HTML' 모드(chaos)**에 들어갔을 때, 새롭게 만들어진 갤러리 영역은 아래와 같은 기능을 가집니다.
* 갤러리 영역에 있는 이미지들이 카드 밖으로 튀어나옵니다.
* 이 이미지들 또한 자유롭게 드래그할 수 있습니다.
* 이미지에 미세한 그림자 효과를 넣습니다.

- 클릭하거나 드래그한 카드 또는 이미지가 레이어에서 가장 앞으로 옵니다. 즉, 다른 카드나 이미지에 가려지지 않습니다.

- 실제 코드 패치를 수행하기 전 위 요청사항들을 적용한 spec documents 문서 업데이트를 먼저 진행한 후, 이를 기반으로 패치를 진행하세요.

# Requirements 4-(2)_0612_Hyebin
- Requirements 4에서 요청한 첫 번째 사항, 이미지가 들어갈 수 있는 갤러리 영역의 2열 레이아웃이 정상적으로 적용되었는지 검토해주세요.
만약 충족되지 않았을 경우, 충족하도록 패치해주세요.
- **'I HATE HTML' 모드(chaos)**에 들어갔을 때, 개별 이미지도 스크롤 영역에서 튀어나옵니다. 이 때 튀어나와 배치된 그 지점이 속해있던 카드에서 지나치게 멀어지지 않도록 해주세요.

- 실제 코드 패치를 수행하기 전 위 요청사항들을 적용한 spec documents 문서 업데이트를 먼저 진행한 후, 이를 기반으로 패치를 진행하세요.