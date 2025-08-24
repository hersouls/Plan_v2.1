# Figma ↔ Moonwave 코드 매핑 표준

## 1) 디자인 토큰 매핑

- **Color**: Semantic/Foundations → CSS 변수 (예: `--semantic-primary-600`)
- **Typography**: 폰트/사이즈/자간 → `TypographyTokens`
- **Spacing**: 8px 그리드 → `--semantic-spacing-*`
- **Radius/Shadow**: `--foundation-borderRadius-*`, `--foundation-shadow-*`

## 2) 컴포넌트 매핑 (`@moonwave/ui`)

- **Button**: `<Button variant="primary|secondary|danger" size="sm|md|lg" />`
- **Card**: `<Card variant="default|elevated|interactive" />`
- **Input**: `<Input error />`
- **Background**: `<WaveBackground asFixed />`
- **Layout**: `<AppShell Header={Header} Footer={FooterBasic} />`

## 3) 네이밍 규칙(Figma)

- **컴포넌트**: `MW/{Category}/{Name}`
- **Variant**: `{Name}=Primary|Secondary|…` · `Size=Sm|Md|Lg`
- **Tokens**: `mw/color/semantic/primary-600`, `mw/spacing/sm`

## 4) 핸드오프 메모 필수 항목

- **상태**: `default/hover/focus/disabled`
- **상호작용**: 클릭/키보드 포커스/애니메이션
- **접근성**: `role`, `aria-label`, focus order
- **반응형**: `xs/sm/md/lg` 주요 스냅샷
