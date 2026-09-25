# Marca RL — origen del logo vectorial

El logo que sirve la landing **no es un redibujo**: son los contornos exactos del
arte oficial, trazados de los PNG maestros que están en esta carpeta.

## Archivos

| Archivo | Qué es |
|---|---|
| `RL-13-lockup-horizontal.png` | Lockup horizontal (símbolo + RETORNO/LOGISTICO). 4500×4500, RGBA, arte a 4221×1174. |
| `RL-06-lockup-vertical.png` | Lockup vertical. Contiene el **símbolo aislado**, que en el horizontal se fusiona con la R. |
| `trace-logo.py` | Trazador: umbral de tinta → componentes conexos → Moore-neighbour → Douglas-Peucker, con contraformas. |
| `verify-trace.py` | Rasteriza los paths de vuelta a resolución fuente y saca IoU contra el PNG. |

Tinta oficial: **`#37B04A`** (píxel opaco dominante del maestro). Es el token
`--green-logo`. Ojo: NO coincide con `--green-bright` (`#48B158`), que se
muestreó de un deck comprimido y sigue manejando acentos de UI.

## Reproducir

```python
import trace_logo as t, verify_trace as v

lockup = t.trace('RL-13-lockup-horizontal.png', height=128.0, tol_frac=0.0015)
mark   = t.trace('RL-06-lockup-vertical.png',  height=128.0, tol_frac=0.0015,
                 crop=(1848, 737, 2667, 2069))   # solo el símbolo
v.check('RL-13-lockup-horizontal.png', lockup)
```

Después hay que correr los vértices **medio píxel fuente** (`64/alto_fuente`):
el trazado camina centros de píxel y el relleno SVG cae en las esquinas. Sin esa
corrección el IoU se queda en 0.986; con ella sube a 0.996.

Los `<symbol>` resultantes viven en el sprite al inicio de `index.html`
(`#rl-lockup`, `#rl-mark`). Ambos necesitan **`fill-rule="evenodd"`**: los
huecos se trazan con el mismo sentido de giro que el contorno, así que con
`nonzero` las contraformas de R, O y G salen rellenas.

## Fidelidad medida

| | IoU | Desajuste |
|---|---|---|
| Lockup (17 formas) | 0.99603 | 0.40% |
| Símbolo (2 formas) | 0.99746 | 0.25% |

El residuo es antialiasing de los bordes curvos del maestro, no error de
geometría: sobre arte de bordes rectos el trazador recupera los vértices con
error < 0.05 en un espacio de 128 unidades.
