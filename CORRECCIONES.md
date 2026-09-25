# Correcciones técnicas — 23 septiembre 2026

## Aplicado
- Eliminación de preloader bloqueante y de la animación que ocultaba el mensaje inicial.
- Formulario deshabilitado hasta instalar sus eventos, método POST defensivo, botón de composición sin submit y CSP form-action none. El correo sigue requiriendo envío manual desde la aplicación del visitante.
- Eliminación de bloqueos de selección, copia, clic derecho y atajos.
- Videos sin descarga inicial declarativa; carga individual al entrar en pantalla, pausa fuera de pantalla y en pestaña oculta, respeto a movimiento reducido y ahorro de datos.
- Poster real del video y logos WebP con dimensiones explícitas.
- Pasos del circuito sin opacidad reducida y con colores más legibles.
- Etiquetas de regiones y grupo de marcas corregidas. Menú nativo alternativo si JavaScript no ejecuta.
- Animaciones complejas limitadas a escritorio; contenido móvil sin GSAP/Lenis activo.
- Build con lista explícita de archivos públicos en dist; documentación y herramientas internas quedan fuera.
- CSP, anti-framing, política de capacidades y caché para CSS/JS/assets sin immutable, para no congelar versiones con nombres estables.
- Metadatos y sitemap generados sólo cuando SITE_URL declara el dominio real. Sin esa variable, el build es de prueba y no indexable.
- Manifiesto SHA-256 de las bibliotecas locales. No se actualizaron sus versiones ni se repitió el análisis OSV.

## Pendiente antes de producción
1. Confirmar dominio y configurar SITE_URL (ejemplo de formato: https://dominio-confirmado.mx). No se modifica DNS ni se publica desde esta entrega.
2. Se incorporó el aviso de privacidad según la instrucción de la empresa; quedan pendientes su correspondencia con la operación real y su validación antes de publicar.
3. Si se requiere envío automático, seleccionar e integrar un backend o proveedor de correo. Actualmente no existe confirmación de entrega.
4. Verificar cabeceras en el hosting real y medir Lighthouse bajo las mismas condiciones del reporte. No se promete un puntaje nuevo.
5. Minificación y sustitución de bibliotecas por módulos más pequeños quedan como optimización adicional; se preserva la estética de escritorio.

## Uso
Requiere Node.js 20 o posterior. Ejecutar `npm run check` y `npm run build` desde la raíz. Servir dist/ por HTTP. Vercel ejecuta el build indicado en vercel.json. Para producción, definir SITE_URL antes del build. Las bibliotecas GSAP, ScrollTrigger y Lenis se sirven localmente; no hay dependencias npm necesarias para compilar.

## Verificación realizada
- Sintaxis de los tres scripts: correcta.
- Prueba aislada del formulario: submit cancelado, composición mailto codificada, validación y activación después de instalar manejadores: correcta.
- Build de producción con dominio de prueba y build sin dominio: correctos.
- Referencias locales del HTML y límites de publicación: correctos.
- Video principal: 2,117,401 a 845,359 bytes (60 % menos).
- No fue posible ejecutar pruebas visuales ni Lighthouse: navegador no instalado y descarga fallida. Se requiere revisión visual en escritorio/móvil, prueba real del cliente de correo y comprobación de cabeceras antes de publicar.

## Incorporación del aviso de privacidad
Se incorporó aviso-de-privacidad.html y su CSS, un aviso simplificado antes del botón del formulario y enlaces desde formulario y pie. El build incluye la página y la incorpora al sitemap cuando SITE_URL está configurado. El texto declara consulta interna y atención de solicitudes, sin difusión pública, venta ni publicidad, conforme a la instrucción de la empresa. Se usa el domicilio y correo ya presentes en el sitio.
El aviso incorpora un canal para derechos sobre los datos. Su publicación no configura por sí misma la retención o borrado del buzón ni acredita cumplimiento: la empresa debe operar según estas finalidades y atender las solicitudes recibidas. El código permanece pendiente de validación funcional en navegador y no se ha publicado.
