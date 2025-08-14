# Mizu Notes 📝

Un bloc de notas SPA (Single Page Application) optimizado para dispositivos móviles con pestañas múltiples, guardado local y funcionalidades básicas de edición.

## 🎯 **Prioridad del proyecto**

**Mizu Notes está diseñado principalmente para dispositivos móviles** con soporte secundario para PC y TV. La interfaz prioriza:

- 📱 **Pantallas táctiles** - Botones grandes y fáciles de tocar
- 🎮 **Controles de TV** - Navegación con 5 botones básicos (4 direcciones + 1 acción)
- 💻 **Compatibilidad PC** - Atajos de teclado como complemento

## ✨ Características actuales

### 🗂️ **Gestión de pestañas**
- Múltiples pestañas para trabajar con varios documentos
- Crear nuevas pestañas al instante
- Cerrar pestañas individuales
- Navegación fluida entre pestañas
- Nombres personalizables para cada pestaña

### 🔍 **Búsqueda y reemplazo** ⚠️
- Búsqueda en tiempo real
- Navegación entre resultados encontrados
- Reemplazo individual o masivo
- Búsqueda insensible a mayúsculas/minúsculas
- **Limitación actual:** La búsqueda puede ser lenta en archivos grandes

### ⌨️ **Atajos de teclado (PC)**
- `Ctrl+F` - Buscar
- `Ctrl+H` - Buscar y reemplazar
- `F3` - Siguiente resultado de búsqueda
- `Shift+F3` - Resultado anterior de búsqueda
- `F1` - Mostrar ayuda
- `Escape` - Cerrar búsqueda o ayuda

**Nota:** Los atajos Ctrl+N y Ctrl+W se removieron temporalmente por conflictos con el navegador.

### 💾 **Persistencia y exportación**
- Guardado automático en localStorage
- Exportación a múltiples formatos (.txt, .html, .css, .js, .md)
- Nombres de archivo personalizables
- Sin pérdida de datos

### 🔗 **Funcionalidades de texto**
- Conversión de texto seleccionado en hipervínculos
- Enlaces se abren en nueva pestaña
- Estilo visual distintivo para enlaces

### 🎨 **Interfaz optimizada para móviles**
- Tema oscuro elegante
- Botones grandes para pantallas táctiles (mínimo 44px)
- Diseño responsive
- Información del programa visible (nombre, versión, ayuda)
- Feedback visual para acciones importantes

## 🚀 Instalación

### Opción 1: Descarga directa
1. Descarga el archivo `index.html`
2. Ábrelo en tu navegador web
3. ¡Listo para usar!

### Opción 2: Clonar el repositorio
```bash
git clone https://github.com/mizulegendsstudios/mizu_notes.git
cd mizu_notes
# Abre index.html en tu navegador
```

### Opción 3: Servidor local
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8000
```

## 📱 Compatibilidad

### ✅ **Dispositivos móviles (Prioridad)**
- Chrome Mobile
- Safari iOS
- Firefox Mobile
- Samsung Internet

### ✅ **PC (Soporte secundario)**
- Chrome/Chromium
- Firefox
- Safari
- Edge

### ⚠️ **TV (Soporte básico)**
- Navegadores web de Smart TV
- Controles remotos con 5 botones básicos
- **Limitación:** La exportación de archivos puede no funcionar en algunas TV debido a restricciones del sistema

## 🛠️ Tecnologías utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos responsive y optimizados para touch
- **JavaScript ES6+** - Funcionalidad completa
- **localStorage** - Persistencia de datos
- **File API** - Exportación de archivos

## ⚠️ **Limitaciones actuales**

### Problemas conocidos:
1. **Búsqueda lenta** - En archivos muy grandes (>10,000 líneas)
2. **Atajos de teclado** - Solo funcionan en PC, no en móviles
3. **localStorage** - Límite de ~5-10MB por dominio
4. **Sin sincronización** - Los datos solo se guardan localmente

### Funcionalidades pendientes:
- [ ] Búsqueda con expresiones regulares
- [ ] Resaltado de sintaxis
- [ ] Temas claro/oscuro
- [ ] Estadísticas del documento
- [ ] Deshacer/Rehacer
- [ ] Sincronización en la nube

## 🔧 Personalización

### Temas
El tema actual es oscuro por defecto. Puedes personalizar los colores editando las variables CSS en el archivo `index.html`.

### Atajos de teclado
Los atajos de teclado son completamente personalizables editando el objeto de eventos en el JavaScript.

### Formatos de exportación
Puedes agregar más formatos de exportación modificando el array de opciones en el HTML.

## 📈 Roadmap

### v0.3.0 (Próximamente)
- [ ] Optimización de búsqueda para archivos grandes
- [ ] Temas claro/oscuro
- [ ] Estadísticas del documento (palabras, líneas, caracteres)
- [ ] Mejor soporte para controles de TV

### v0.4.0
- [ ] Búsqueda con expresiones regulares
- [ ] Resaltado de sintaxis para lenguajes de programación
- [ ] Menú contextual (click derecho)
- [ ] Drag & Drop para reordenar pestañas

### v1.0.0
- [ ] Sincronización en la nube
- [ ] Colaboración en tiempo real
- [ ] Extensiones y plugins
- [ ] API para desarrolladores

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si quieres contribuir:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Prioridades para contribuciones:
1. **Optimización móvil** - Mejorar experiencia en pantallas táctiles
2. **Soporte TV** - Mejorar navegación con controles remotos
3. **Rendimiento** - Optimizar búsqueda y manejo de archivos grandes
4. **Accesibilidad** - Mejorar soporte para lectores de pantalla

## 📄 Licencia

Este proyecto está bajo la Licencia AGPL-3.0. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Inspirado en editores de texto modernos
- Comunidad de desarrolladores web
- Usuarios que han probado y reportado bugs
- Filosofía de los 5 botones básicos de Atari

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:

- Abre un [issue](https://github.com/mizulegendsstudios/mizu_notes/issues)
- Contacta al desarrollador
- Revisa la documentación

---

**Mizu Notes v0.2.0** - Desarrollado por Moises Núñez con ❤️ para la comunidad de desarrolladores

*Optimizado para móviles, compatible con PC y TV*
