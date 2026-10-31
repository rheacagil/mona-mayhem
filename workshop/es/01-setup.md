<!-- l10n-sync: source-file="workshop/01-setup.md" -->
# Parte 1: Configuración e ingeniería de contexto

---

En esta parte configurarás tu entorno de desarrollo **y** enseñarás a Copilot cómo es el código base, para que cada prompt futuro comience con el contexto adecuado.

## Sección 1: Configuración inicial

### Paso 1: Crea tu repositorio

1. Abre [github.com/copilot-dev-days/mona-mayhem](https://github.com/copilot-dev-days/mona-mayhem)
2. Crea tu propio repositorio mediante una de estas opciones:
   - haz clic en **Use this template** → **Create a new repository**, o
   - crea un fork del repositorio.
3. Llámalo `my-mona-mayhem` y establece la visibilidad como **Public** (si lo creaste a partir de la plantilla).

<!-- track:vscode:start -->
### Paso 2: Elige tu entorno de desarrollo

#### Opción A: VS Code local

1. Abre VS Code y ejecuta **Git: Clone** → **Clone from GitHub**
2. Selecciona tu repositorio `my-mona-mayhem`
3. Cuando se te solicite, instala las **extensiones recomendadas**

#### Opción B: GitHub Codespaces

1. Abre tu repositorio en GitHub
2. Haz clic en **Code** → **Codespaces** → **Create codespace on main**
3. Espera a que se inicie el entorno y se instalen las dependencias

### Paso 3: Instala las dependencias e inicia la aplicación

1. Abre el terminal integrado en tu repositorio.
2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Inicia la aplicación:

   ```bash
   npm run dev
   ```

> ✅ **¡La aplicación está abierta en tu navegador!**
<!-- track:vscode:end -->

<!-- track:cli:start -->
### Paso 2: Instala GitHub Copilot CLI

Elige el método de instalación que corresponda a tu equipo:

- **npm (multiplataforma, requiere Node.js 22+)**

  ```bash
  npm install -g @github/copilot
  ```

- **Homebrew (macOS/Linux)**

  ```bash
  brew install copilot-cli
  ```

- **WinGet (Windows)**

  ```bash
  winget install GitHub.Copilot
  ```

### Paso 3: Inicia la aplicación y autentica el CLI

1. Clona tu repositorio localmente y abre un terminal en la raíz del proyecto.
2. Instala las dependencias e inicia la aplicación:

   ```bash
   npm install
   npm run dev
   ```

3. Abre un **segundo terminal** en el mismo repositorio e inicia Copilot CLI:

   ```bash
   copilot
   ```

4. En la sesión interactiva, escribe:

   ```
   /login
   ```

5. Sigue las instrucciones del flujo de autenticación del dispositivo y confirma que confías en el repositorio cuando el CLI te pida aprobación.

> ✅ **Ahora tienes la vista previa de la aplicación en un terminal y Copilot CLI listo en otro.**
<!-- track:cli:end -->

## Sección 2: Ingeniería de contexto

La ingeniería de contexto consiste en enseñar a la IA cómo es tu código base. Cuanto mejor sea el contexto, mejores serán todas las respuestas futuras.

<!-- track:vscode:start -->
### Tarea 1: Genera instrucciones del workspace con /init

Usa el comando integrado `/init` para generar un archivo de instrucciones del workspace para Copilot:

1. Abre **Copilot Chat** y escribe:

   ```
   /init simple instructions with a project overview, build/dev commands, and Astro best practices, (ignore the workshop).
   ```

2. Revisa el archivo generado: Copilot analizará el proyecto y creará `.github/copilot-instructions.md`.
3. Acepta los cambios y luego haz **commit** del archivo de instrucciones.

> **Resultado:** Todas las solicitudes futuras a Copilot tendrán incorporado un mapa de tu workspace.

### Tarea 2: Agentes en segundo plano

**Agente local en segundo plano:**

1. En el panel de Chat, haz clic en **+** para abrir un chat nuevo.
2. En la parte inferior de la ventana, cambia **Local** a **Copilot CLI**.
3. Escribe este prompt:

   > "Add linting rules for unused vars and improve code style; fix any errors"

4. Cuando termine, **revisa y aplica** los cambios; después, archiva la sesión si quieres.

**Agente en la nube:**

1. En el panel de Chat, haz clic en **+** para abrir un chat nuevo.
2. En la parte inferior de la ventana, cambia **Local** a **Cloud**.

   > "Make the README more engaging as a landing page"

> **Resultado:** Se añaden reglas de lint, se corrigen errores y mejora el README, todo sin salir del editor.

### Tarea 3: Explora el proyecto

Abre **Copilot Chat** en **modo Ask** y prueba estos prompts:

- `"Explain the architecture of this project"`
- `"What files are in the src directory and what do they do?"`
- `"What would I need to build to make the Battle button work?"`

> 💡 Usa **@workspace** para dar a Copilot contexto de todo el proyecto y obtener respuestas más precisas.
<!-- track:vscode:end -->

<!-- track:cli:start -->
### Tarea 1: Genera instrucciones del repositorio con /init

Usa `/init` para generar un archivo de instrucciones del workspace para Copilot:

1. En Copilot CLI, escribe:

   ```
   /init simple instructions with a project overview, build/dev commands, and Astro best practices, (ignore the workshop).
   ```

2. Revisa el archivo generado: Copilot analizará el proyecto y creará `.github/copilot-instructions.md`.
3. Haz commit del archivo de instrucciones.

> **Resultado:** Las sesiones futuras del CLI heredarán automáticamente las instrucciones específicas del repositorio desde `.github/copilot-instructions.md`.

### Tarea 2: Configura tu entorno de CLI

Practica los controles del CLI que facilitarán los pasos siguientes:

1. Ejecuta `/help` para revisar los comandos slash disponibles.
2. Usa `/model` para consultar los modelos disponibles.
3. Si Copilot ha aprendido demasiadas aprobaciones durante tus pruebas, restablécelas con:

   ```
   /reset-allowed-tools
   ```

4. Si tu repositorio está dentro de un directorio superior más grande, usa `/add-dir PATH` para ampliar explícitamente el workspace permitido.

> 💡 La documentación del CLI recomienda instrucciones personalizadas concisas y permisos explícitos para las herramientas, a fin de que Copilot sea rápido y predecible.

### Tarea 3: Explora el proyecto desde el terminal

Prueba estos prompts en Copilot CLI:

- `Give me an overview of this project.`
- `@src/pages/api/contributions/[username].ts What is this file for and what needs to be built here?`
- `@src/pages/index.astro What exists here and what would I need to add to build the battle page?`

Si quieres una respuesta rápida e independiente de la sesión interactiva, prueba:

```bash
copilot -p "Summarize the architecture of this repo in 5 bullet points"
```

> **Resultado:** Ya tienes instrucciones, conoces los comandos y sabes cómo añadir archivos al contexto de Copilot CLI.
<!-- track:cli:end -->

## ✅ Parte 1 completada

Has aprendido a:

- **Configurar** el repositorio y el entorno de desarrollo local
- **Generar instrucciones** con `/init` para que Copilot entienda el proyecto y su dirección de diseño
- **Establecer el hábito de revisar** los cambios generados antes de aplicarlos
- **Explorar el código base** con prompts que incluyen contexto
