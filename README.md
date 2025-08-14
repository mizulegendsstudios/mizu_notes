# Mizu Notes 📝

Un bloc de notas SPA (Single Page Application) moderno y funcional con pestañas múltiples, guardado local y funcionalidades avanzadas de edición.

## ✨ Características

### 🗂️ **Gestión de pestañas**
- Múltiples pestañas para trabajar con varios documentos
- Crear nuevas pestañas al instante
- Cerrar pestañas individuales
- Navegación fluida entre pestañas
- Nombres personalizables para cada pestaña

### 🔍 **Búsqueda y reemplazo**
- Búsqueda en tiempo real
- Navegación entre resultados encontrados
- Reemplazo individual o masivo
- Búsqueda insensible a mayúsculas/minúsculas
- Auto-scroll a los resultados

### ⌨️ **Atajos de teclado**
- `Ctrl+N` - Nueva pestaña
- `Ctrl+W` - Cerrar pestaña actual
- `Ctrl+F` - Buscar
- `Ctrl+H` - Buscar y reemplazar
- `F3` - Siguiente resultado de búsqueda
- `Shift+F3` - Resultado anterior de búsqueda
- `Ctrl+S` - Guardar cambios
- `F1` - Mostrar ayuda
- `Escape` - Cerrar búsqueda o ayuda

### 💾 **Persistencia y exportación**
- Guardado automático en localStorage
- Exportación a múltiples formatos (.txt, .html, .css, .js, .md)
- Nombres de archivo personalizables
- Sin pérdida de datos

### 🎨 **Interfaz moderna**
- Tema oscuro elegante
- Diseño responsive
- Interfaz intuitiva y limpia
- Fuente monoespaciada para mejor legibilidad del código

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

- ✅ Chrome/Chromium (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Navegadores móviles modernos

## 🛠️ Tecnologías utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y responsive
- **JavaScript ES6+** - Funcionalidad completa
- **localStorage** - Persistencia de datos
- **File API** - Exportación de archivos

## 📋 Funcionalidades técnicas

### Sistema de pestañas
- Gestión dinámica de pestañas
- Persistencia de estado entre sesiones
- Manejo inteligente de índices
- Protección contra pérdida de datos

### Motor de búsqueda
- Búsqueda en tiempo real
- Algoritmo de búsqueda eficiente
- Actualización dinámica de resultados
- Manejo de posiciones de texto

### Sistema de guardado
- Guardado automático en tiempo real
- Compresión de datos en localStorage
- Manejo de errores robusto
- Backup automático de sesión

## 🔧 Personalización

### Temas
El tema actual es oscuro por defecto. Puedes personalizar los colores editando las variables CSS en el archivo `index.html`.

### Atajos de teclado
Los atajos de teclado son completamente personalizables editando el objeto de eventos en el JavaScript.

### Formatos de exportación
Puedes agregar más formatos de exportación modificando el array de opciones en el HTML.

## 📈 Roadmap

### v0.3.0 (Próximamente)
- [ ] Temas claro/oscuro
- [ ] Estadísticas del documento (palabras, líneas, caracteres)
- [ ] Deshacer/Rehacer
- [ ] Configuración de fuente personalizable

### v0.4.0
- [ ] Drag & Drop para reordenar pestañas
- [ ] Menú contextual (click derecho)
- [ ] Búsqueda con expresiones regulares
- [ ] Resaltado de sintaxis para lenguajes de programación

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

## 📄 Licencia

Este proyecto está bajo la Licencia AGPL-3.0. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Inspirado en editores de texto modernos
- Comunidad de desarrolladores web
- Usuarios que han probado y reportado bugs

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:

- Abre un [issue](https://github.com/mizulegendsstudios/mizu_notes/issues)
- Contacta al desarrollador
- Revisa la documentación

---

**Mizu Notes v0.2.0** - Desarrollado por Moises Núñez con ❤️ para la comunidad de desarrolladores
