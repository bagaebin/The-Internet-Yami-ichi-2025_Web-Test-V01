# Design System Documentation

## 1. 개요 (Overview)
이 문서는 'The Internet Yami-ichi 2025' 웹사이트의 디자인 시스템을 정의합니다. 레트로 퓨처리스틱(Retro-futuristic)과 사이버펑크(Cyberpunk) 미학을 기반으로 하며, 반응형 웹 환경에서의 가독성과 심미성을 고려하여 설계되었습니다.

## 2. 타이포그래피 (Typography)
웹폰트와 시스템 폰트를 혼합하여 독특한 분위기를 연출하면서도 성능을 최적화했습니다.

### 2.1 폰트 패밀리 (Font Family)
*   **Primary**: `Turret Road` (Google Fonts) - 제목, 강조 텍스트, UI 요소에 사용. 기계적이고 미래지향적인 느낌.
*   **Fallback**: `system-ui`, `-apple-system`, `sans-serif` 등 시스템 기본 폰트.

### 2.2 폰트 웨이트 (Font Weights)
*   **Extra Light (200)** ~ **Extra Bold (800)**: `Turret Road`의 다양한 웨이트를 활용하여 정보의 위계를 표현.
*   **Regular (400)**, **Medium (500)**: 본문 가독성 확보.

### 2.3 텍스트 스타일 (Text Styles)
*   **Card Title**: `28px`, `800` weight, Uppercase, Letter-spacing `.08em`. 강렬한 헤드라인.
*   **Card Heading**: `18px`, `700` weight. 섹션 구분.
*   **Body Text**: `16px` (기본), Line-height `1.5`.
*   **Small Text**: `13px` (Artist info), `14px` (Subtext).
*   **Code**: `Courier New`, `Courier`, `monospace`, `12px`, 배경색 포함.

## 3. 컬러 팔레트 (Color Palette)
CSS Variables(`:root`)를 사용하여 일관된 컬러 시스템을 구축했습니다.

### 3.1 기본 컬러 (Core Colors)
*   **Background**: `#d4f8fb` (밝은 청록색, 레트로 모니터 느낌)
*   **Text**: `#101010` (거의 검은색, 높은 대비)
*   **Outline**: `rgba(0, 0, 0, 0.10)` (은은한 테두리)
*   **Highlight/Shadow**: 입체감(Bevel) 표현을 위한 반투명 화이트/블랙.

### 3.2 카테고리 컬러 (Category Colors)
각 섹션별 아이덴티티를 부여하기 위해 배경색과 강조색을 분리했습니다.
*   **Market**: Bg `#e8f3ff`, Accent `#0869fb` (Blue)
*   **Exhibition**: Bg `#dee1ff`, Accent `#744bf7` (Purple)
*   **Film Screening**: Bg `#f8e6fa`, Accent `#c52fcd` (Pink)

## 4. 레이아웃 및 그리드 (Layout & Grid)
Flexbox와 Grid를 혼합하여 유연한 반응형 레이아웃을 구현했습니다.

### 4.1 컨테이너 (Container)
*   `.wrap`: 전체 레이아웃을 감싸며 중앙 정렬.
*   `.grid`: 카드 아이템들을 배치하는 Flex 컨테이너 (`flex-wrap: wrap`).

### 4.2 카드 시스템 (Card System)
*   **기본 카드**: `max-width: 480px` (`--card-max`). 모바일에서는 100% 너비.
*   **Bevel Effect**: CSS `box-shadow`를 활용한 '흰색 부조' 스타일로 입체감 부여. `border-radius` 없는 날카로운 엣지.
*   **Gallery Card**: 내부 그리드 시스템 사용 (`grid-template-columns`).

### 4.3 여백 (Spacing)
*   **Padding**: 카드 내부 `16px 18px`.
*   **Gap**: 그리드 아이템 간 간격 조절.
*   **Fluid Spacing**: `clamp()` 함수를 사용하여 뷰포트 크기에 따라 여백이 자연스럽게 조절됨.

## 5. 반응형 디자인 (Responsive Design)
모바일 퍼스트보다는 데스크탑 중심에서 축소되는 형태로 보이나, 주요 브레이크포인트에서 레이아웃이 최적화됩니다.

### 5.1 브레이크포인트 (Breakpoints)
*   **1024px**: 랜딩 페이지 패딩 및 로고 크기 조정.
*   **900px**: 2열 그리드(`card-event__body`)가 1열로 변경. 태블릿/좁은 데스크탑 대응.
*   **768px**: 모바일 뷰 시작. 패딩 축소, 폰트 사이즈 조정.
*   **480px**: 소형 모바일. 패딩 최소화, 타이틀 폰트 사이즈 축소.

### 5.2 유동적 단위 (Fluid Units)
*   `clamp(min, val, max)`를 적극 활용하여 폰트 크기, 마진, 패딩이 해상도에 따라 부드럽게 변하도록 설계.
    *   예: `padding: clamp(24px, 4vw, 48px)`

## 6. UI 컴포넌트 (UI Components)
*   **Buttons**: `.icon-button`, `.hate-html-toggle`. 입체적인 버튼 스타일, 호버 시 `transform` 효과.
*   **Badges**: `.pill`. 둥근 모서리(`border-radius: 999px`)로 카드와 대비되는 형태.
*   **Scrollbar**: 커스텀 스크롤바 스타일링 (Webkit 기반 브라우저).

## 7. 평가 및 제언 (Evaluation & Suggestions)

### 7.1 에디토리얼 디자인 평가 (Editorial Design Evaluation)
*   **위계성 (Hierarchy)**: `.card-title` (28px, 800, Uppercase)과 `.card-text` (16px, 500) 간의 대비가 매우 명확하여 정보의 구조를 한눈에 파악할 수 있습니다.
*   **가독성 (Readability)**: 본문 텍스트의 `line-height: 1.5` 설정은 웹 환경에서 최적의 가독성을 제공하며, `overflow-wrap: anywhere` 속성으로 긴 단어에 의한 레이아웃 깨짐을 방지했습니다.
*   **여백 (Spacing)**: 제목 하단의 `10px` 마진과 컨테이너의 `gap`이 결합되어 제목과 본문 사이에 적절한 호흡을 부여합니다. 이는 사용자가 콘텐츠를 구분하여 읽는 데 도움을 줍니다.

*   **심미성**: 레트로한 윈도우 UI와 현대적인 3D 효과가 잘 어우러져 독창적인 브랜드 아이덴티티를 구축함.
*   **체계성**: CSS 변수를 활용한 컬러 및 수치 관리가 잘 되어 있어 유지보수가 용이함.
*   **반응형**: `clamp`와 적절한 미디어 쿼리 사용으로 다양한 디바이스 대응이 우수함. 다만, 900px ~ 1024px 구간에서 카드 배치가 애매해질 수 있으므로 확인 필요.

---
*Last Updated: 2025-12-14*
