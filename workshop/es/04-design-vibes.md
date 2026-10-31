<!-- l10n-sync: source-file="workshop/04-design-vibes.md" -->
# Parte 4: Tematización orientada al diseño

---

En esta parte usarás los ciclos de planificación e implementación de Copilot para diseñar una transformación completa del tema. Este enfoque de desarrollo empieza por el diseño: define la visión, itera sobre los elementos visuales y deja que Copilot se encargue del trabajo pesado de CSS.

## Tarea 1: Planifica el tema retro

<!-- track:vscode:start -->
Cambia a **Plan** en GitHub Copilot Chat.
<!-- track:vscode:end -->

<!-- track:cli:start -->
Usa `/plan` en GitHub Copilot CLI o pulsa **Shift+Tab** hasta activar el modo plan.
<!-- track:cli:end -->

Escribe este prompt:

> I want to transform this page into a full retro arcade experience. Plan a comprehensive visual overhaul that includes: CRT scanline effects on the background, neon glow on the title that pulses like a neon sign, animated VS badge with gradient color shifts, shine/shimmer overlay on the user result cards, float-in animations for input fields, color-shifting loading text between green and purple, and hover glow effects on contribution squares. Keep the dark background (`#0a0a1a`) with green (`#5fed83`) and purple (`#8a2be2`) accent colors. Use a dark theme with the Press Start 2P retro gaming font from Google Fonts.

Copilot generará un plan detallado con todos los efectos visuales. **No lo aceptes de inmediato**: revisa el plan e itera:

- Sugiere ajustes a la duración de las animaciones (por ejemplo, *"Make the neon pulse slower, around 3 seconds"*)
- Pregunta por efectos concretos (por ejemplo, *"How will the shimmer overlay work on the cards?"*)
- Pide cambios en el enfoque si algo no te convence

## Tarea 2: Implementa el tema

Cuando estés satisfecho con el plan, pide a Copilot que lo implemente.

> Implement the retro arcade theme plan we just designed.

Copilot añadirá varias animaciones CSS, pseudoelementos y transiciones a la hoja de estilos. Por ejemplo, puede incluir:

- `@keyframes` para scanlines, pulso de neón, shimmer y efectos de aparición flotante
- Pseudoelementos (`::before`, `::after`) para efectos de superposición
- Propiedades personalizadas CSS para los colores del tema
- Transiciones y estados hover para los elementos interactivos

<!-- track:cli:start -->
Una vez aplicados los cambios, usa `/diff` para revisar los estilos antes de aprobarlos.
<!-- track:cli:end -->

## Tarea 3: Ajusta el aspecto

> **⚠️ ¿No aparecen los cambios?** Si no ves el tema o las animaciones, detén el servidor de desarrollo (`Ctrl+C`), reinícialo con `npm run dev` y fuerza la recarga del navegador (`Ctrl+Shift+R`).

Mantén abierta la vista previa en el navegador e itera sobre el diseño. Prueba prompts como:

> The scanline effect is too strong, reduce opacity to 0.03

> Add a subtle electrical flicker to the title text

> The VS badge should pulse more dramatically

Este es el **desarrollo orientado al diseño**: iteras sobre el resultado visual en tiempo real. Cada prompt refina la experiencia hasta que tenga el aspecto adecuado. No te conformes con algo «suficientemente bueno»: lleva el estilo al máximo hasta que la página parezca una máquina recreativa.

## Tarea 4: Actualiza las instrucciones

Tus instrucciones deben reflejar las decisiones de diseño importantes para que los prompts posteriores mantengan la coherencia.

<!-- track:vscode:start -->
Pide a Copilot Chat:

> Add a design guide section to copilot-instructions.md describing our retro arcade theme: colors, fonts, animation style
<!-- track:vscode:end -->

<!-- track:cli:start -->
Pide a Copilot CLI:

> Update our repository instructions with a short design guide for the retro arcade theme: colors, fonts, animation style, and the rule that new UI should keep the neon aesthetic.
<!-- track:cli:end -->

Cuando la página tenga el aspecto que quieres, haz commit de las instrucciones y los cambios de diseño.

## ✅ Parte 4 completada

**Lo que has aprendido:**

- Usar flujos de planificación para esbozar un **sistema de diseño antes de implementarlo**
- **Iterar sobre el resultado visual** con prompts de seguimiento rápidos
- **Actualizar las instrucciones tras tomar decisiones importantes** para mantener la identidad visual de Copilot
