# Guía de uso de TRAYECTORIA

TRAYECTORIA es un laboratorio escolar para explorar el movimiento parabólico a partir de un saque de voleibol. No necesita instalar programas ni librerías.

## Abrir el proyecto

1. Descarga o descomprime la carpeta del proyecto.
2. Abre el archivo index.html con un navegador actualizado.
3. Si el navegador pregunta permisos, no son necesarios: la aplicación funciona completamente en el equipo.

## 1. Simula un saque

1. En **Simula un saque**, elige un saque predeterminado (*Suave*, *Normal* o *Potente*) o mueve los controles.
   - **Velocidad inicial:** qué tan rápido sale el balón.
   - **Ángulo de salida:** inclinación del saque.
   - **Gravedad:** intensidad con la que el balón es atraído hacia abajo.
2. Pulsa **Hacer el saque**. El balón sale de la mano de la voleibolista y sigue la trayectoria calculada.
3. Lee los resultados:
   - **Vx y Vy:** componentes horizontal y vertical de la velocidad inicial.
   - **Tiempo de vuelo:** cuánto dura el recorrido.
   - **Altura máxima:** punto más alto sobre la mano que realiza el saque.
   - **Alcance:** distancia horizontal recorrida.
4. Pulsa **Volver al inicio** para poner el balón de nuevo en la mano. Cambia solo una variable por vez si quieres descubrir su efecto.

La línea punteada muestra la ruta completa calculada; la línea blanca muestra la parte que el balón ya recorrió.

## 2. Compara

1. Configura un saque en el simulador.
2. Entra a **Compara** y pulsa **Guardar los valores actuales**.
3. Regresa al simulador, cambia algún valor y guarda otra prueba.
4. Compara las curvas y la tabla. Se pueden guardar hasta tres saques.

La gráfica queda vacía hasta que guardes una prueba; así no confunde una curva de ejemplo con un resultado real.

## 3. Resuelve retos

1. Abre un reto.
2. Escribe una predicción antes de probar.
3. Elige un valor y pulsa **Guardar prueba**. Puedes guardar hasta cuatro pruebas por reto.
4. Usa la tabla y la gráfica para revisar tu predicción.
5. Pulsa **Ver explicación** cuando quieras contrastar tu conclusión con la idea física principal.

Los retos no dan una calificación automática: lo importante es justificar qué variable cambió y qué efecto produjo.

## 4. Aprende lo esencial

La última sección resume las ideas para la exposición: parábola, componentes horizontal y vertical, gravedad, ángulo y alcance. Úsala para preparar una explicación breve al público.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo, trayectoria.
2. Sube **el contenido de esta carpeta**: index.html, las carpetas css, js, assets, pruebas y esta guía. No subas la carpeta contenedora vacía por encima de index.html.
3. En el repositorio, entra a **Settings** → **Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama main y la carpeta /(root), luego pulsa **Save**.
6. Espera a que GitHub muestre el enlace publicado. Tendrá una forma similar a https://tu-usuario.github.io/trayectoria/.
7. Abre ese enlace en un celular y en un computador para comprobar los controles, la animación y la lectura de la tabla.

## Nota del modelo

El cálculo usa un modelo ideal de movimiento parabólico: gravedad constante, sin aire, viento ni rotación. Toma la altura de la mano que golpea el balón como y = 0; por eso, en la simulación matemática, el balón llega a la misma altura desde la que salió. Un saque real también depende de la altura de golpe, la red, la técnica y la resistencia del aire.

## Para presentar el proyecto

Puedes iniciar con el saque *Normal* y explicar: “Cambiamos la velocidad, el ángulo o la gravedad; el programa calcula con trigonometría el tiempo, la altura y el alcance del balón”. Después compara dos saques o resuelve el reto de 30° y 60°.


## Novedades de esta versión

- **Orden de la aplicación:** 1) Aprende lo esencial, 2) Simula un saque, 3) Compara los saques, 4) Resuelve retos.
- **Aprende lo esencial:** animación de conceptos, ocho tarjetas con ejemplos y una actividad para unir cada concepto con su significado.
- **Cancha de voleibol:** la mano de la jugadora es el origen (0, 0) de las ecuaciones. La línea de saque está a 9 m de la red, la red mide 2,24 m y la mano golpea a 2,3 m del piso. El resultado indica si el saque pasa la red y si cae dentro de la cancha contraria.
- **Modelo ideal:** T, H y R siguen midiéndose hasta que el balón vuelve a la altura de la mano. Para saber dónde cae en el piso y si pasa la red, se prolongan las mismas ecuaciones (sin aire, g constante). No incluye aire, efecto ni rotación.
- **Retos con preguntas A, B y C:** primero se responde y se recibe una explicación; luego se desbloquea el experimento con hasta 4 pruebas guardadas, gráfica y tabla. La explicación final interpreta los datos que guardó cada estudiante. El reto 5 (ángulo y altura máxima) se conservó y también tiene su pregunta A, B y C.
- **Corrección técnica:** se corrigieron dos paréntesis faltantes en `css/styles.css` que impedían aplicar los estilos de pantallas pequeñas.
