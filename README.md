# Palettax

Aplicación de escritorio para Windows y macOS para gestionar paletas de colores: importar, editar y exportar paletas trabajando con varias abiertas a la vez en pestañas.

## Funcionalidades

- Importar una o varias paletas de colores a la vez, cada una se abre en su propia pestaña.
- Varias paletas pueden estar abiertas simultáneamente.
- Exportar la paleta activa en cualquiera de los formatos soportados.
- Añadir colores (con selector de color y nombre opcional), borrarlos y reordenarlos (arrastrando o con los botones ↑/↓) dentro de la paleta activa.

## Formatos soportados

### JASC-PAL (`.pal`)

Formato de texto usado por Paint Shop Pro. No admite nombres de color.

```
JASC-PAL
0100
4
255 0 0
0 255 0
0 0 255
255 255 255
```

### GIMP Palette (`.gpl`)

Formato de texto de GIMP. Admite nombre de paleta, número de columnas y nombre por color.

```
GIMP Palette
Name: My Palette
Columns: 4
# Generado por Palettax
255   0   0	Red
  0 255   0	Green
  0   0 255	Blue
255 255 255	White
```

### Hex List (`.txt`)

Lista de texto plano, un color hexadecimal por línea. No admite nombres de color.

```
#FF0000
#00FF00
#0000FF
#FFFFFF
```

### CSS Custom Properties (`.css`)

Genera un bloque `:root` con una variable por color. Al importar solo se leen los valores hexadecimales; el nombre de la variable no se conserva (los colores importados no llevan nombre).

```
:root {
  --color-1: #FF0000;
  --color-2: #00FF00;
  --color-3: #0000FF;
  --color-4: #FFFFFF;
}
```

## Requisitos

- Node.js 20 (LTS) y npm.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre la app con hot-reload sobre Electron.

## Tests

```bash
npm test
```

Ejecuta la suite de Jest sobre las funciones puras de `src/shared` (parsers/serializers de `.pal`/`.gpl`/`.txt`/`.css` y utilidades de color), ubicada en `/test` en espejo de `src/shared`.

## Compilación local

```bash
npm run build:mac   # genera un .dmg en release/
npm run build:win   # genera un instalador .exe (NSIS) en release/
```

Para usar un icono propio, coloca `icon.icns` e `icon.ico` en `build/` (ver `build/README.md`).

## Publicar una versión (releases en GitHub)

Al empujar un tag `vX.Y.Z`, el workflow `.github/workflows/release.yml` compila la app en Windows y macOS y publica los instaladores en la sección Releases del repositorio:

```bash
npm version patch   # o minor / major
git push --follow-tags
```

Los instaladores quedarán disponibles para descargar desde Releases sin necesidad de compilar localmente.

## Uso

1. **Importar**: pulsa "Importar" (o "+ Importar" en la barra de pestañas) y selecciona uno o varios ficheros `.pal`/`.gpl`/`.txt`/`.css`. Cada uno se abre en una pestaña nueva.
2. **Cambiar de paleta**: haz clic en la pestaña correspondiente. Puedes cerrar una pestaña con la "×".
3. **Añadir color**: con la pestaña deseada activa, pulsa "Añadir color", elige el color con el selector y, opcionalmente, ponle un nombre.
4. **Borrar color**: pulsa la "✕" del color a eliminar.
5. **Reordenar colores**: arrastra un color a su nueva posición, o usa los botones ↑/↓.
6. **Exportar**: con la paleta activa lista, elige uno de los formatos disponibles (`.pal`, `.gpl`, `.txt`, `.css`) desde "File → Export Palette as" y elige dónde guardarlo.

## Estructura del proyecto

```
src/
├── main/       # proceso principal de Electron (ventanas, menú, diálogos de fichero)
├── preload/    # puente seguro entre main y renderer
├── shared/     # código puro: modelos de datos, parsers/serializers .pal/.gpl/.txt/.css, utilidades
└── renderer/   # interfaz en React (pestañas, lista de colores, diálogos)
test/           # tests de Jest, en espejo de src/shared
```
