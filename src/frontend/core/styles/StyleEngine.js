// core/StyleEngine.js
/*
 * Mizu Notes - Core/StyleEngine
 * Copyright (C) 2025 Mizu Legends Studios
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/*
 * Motor de estilos de Mizu Notes
 * Responsable de generar dinámicamente los estilos CSS de la aplicación
 * Rol: Generación dinámica de estilos CSS
 * Filosofía: Crear estilos de forma programática sin archivos CSS estáticos
 * Principios:
 * - Cloud-Native: Ejecución 100% en navegador
 * - Extensible por diseño: Temas dinámicos y componentes modulares
 * - Licencia libre: GNU AGPL-3.0
 * - Zero Dependencies: ES6+ JavaScript vainilla
 */

export class StyleEngine {
  constructor() {
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'mizu-notes-styles';
    document.head.appendChild(this.styleElement);
    this.themes = new Map();
    this.currentTheme = 'default';
    this.components = new Map();
    console.log('StyleEngine: Inicializado');
  }

  // Generar los estilos base de Mizu Notes
  generateBaseStyles() {
    console.log('StyleEngine: Generando estilos base de Mizu Notes...');
    
    const baseStyles = `
      :root {
        /* Paleta de colores principal - Mizu Notes */
        --primary-color: #4361ee;
        --primary-dark: #3a56d4;
        --primary-light: #5d76f0;
        
        --secondary-color: #7209b7;
        --secondary-dark: #5e0896;
        --secondary-light: #8a2be2;
        
        --accent-color: #4cc9f0;
        --accent-dark: #2bb4e0;
        --accent-light: #6fd4f4;
        
        /* Colores de estado */
        --success-color: #4bb543;
        --success-dark: #3a8c34;
        --success-light: #6bc764;
        
        --error-color: #e63946;
        --error-dark: #c1121f;
        --error-light: #ec5c68;
        
        --warning-color: #ff9e00;
        --warning-dark: #cc7e00;
        --warning-light: #ffb133;
        
        /* Colores neutros */
        --text-dark: #2b2d42;
        --text-light: #8d99ae;
        --text-lighter: #adb5bd;
        
        --bg-light: #f8f9fa;
        --bg-white: #ffffff;
        --bg-dark: #e9ecef;
        
        --border-color: #dee2e6;
        --border-light: #e9ecef;
        --border-dark: #ced4da;
        
        /* Sombras */
        --shadow-color: rgba(0, 0, 0, 0.1);
        --shadow-color-hover: rgba(0, 0, 0, 0.15);
        --shadow: 0 10px 20px var(--shadow-color);
        --shadow-hover: 0 15px 30px var(--shadow-color-hover);
        --shadow-sm: 0 2px 4px var(--shadow-color);
        --shadow-md: 0 4px 8px var(--shadow-color);
        --shadow-lg: 0 8px 16px var(--shadow-color);
        
        /* Espaciado y dimensiones */
        --border-radius: 12px;
        --border-radius-sm: 8px;
        --border-radius-lg: 16px;
        
        --spacing-xs: 4px;
        --spacing-sm: 8px;
        --spacing-md: 16px;
        --spacing-lg: 24px;
        --spacing-xl: 32px;
        --spacing-xxl: 48px;
        
        /* Tipografía */
        --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        --font-size-xs: 12px;
        --font-size-sm: 14px;
        --font-size-md: 16px;
        --font-size-lg: 18px;
        --font-size-xl: 20px;
        --font-size-xxl: 24px;
        --font-size-xxxl: 28px;
        
        /* Transiciones */
        --transition: all 0.3s ease;
        --transition-fast: all 0.15s ease;
        --transition-slow: all 0.5s ease;
        
        /* Z-index */
        --z-dropdown: 1000;
        --z-sticky: 1020;
        --z-fixed: 1030;
        --z-modal-backdrop: 1040;
        --z-modal: 1050;
        --z-popover: 1060;
        --z-tooltip: 1070;
      }

      /* Reset y estilos base */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--font-family);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: var(--text-dark);
        line-height: 1.6;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--spacing-md);
      }

      /* Utilidades de texto */
      .text-gradient {
        background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .text-truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }

      /* Utilidades de flexbox */
      .flex { display: flex; }
      .flex-column { flex-direction: column; }
      .flex-row { flex-direction: row; }
      .flex-center { 
        justify-content: center; 
        align-items: center; 
      }
      .flex-between { justify-content: space-between; }
      .flex-around { justify-content: space-around; }
      .flex-wrap { flex-wrap: wrap; }
      .flex-1 { flex: 1; }
      .flex-auto { flex: auto; }

      /* Utilidades de espaciado */
      .m-0 { margin: 0; }
      .m-sm { margin: var(--spacing-sm); }
      .m-md { margin: var(--spacing-md); }
      .m-lg { margin: var(--spacing-lg); }

      .p-0 { padding: 0; }
      .p-sm { padding: var(--spacing-sm); }
      .p-md { padding: var(--spacing-md); }
      .p-lg { padding: var(--spacing-lg); }

      .mt-sm { margin-top: var(--spacing-sm); }
      .mt-md { margin-top: var(--spacing-md); }
      .mt-lg { margin-top: var(--spacing-lg); }

      .mb-sm { margin-bottom: var(--spacing-sm); }
      .mb-md { margin-bottom: var(--spacing-md); }
      .mb-lg { margin-bottom: var(--spacing-lg); }

      .ml-sm { margin-left: var(--spacing-sm); }
      .ml-md { margin-left: var(--spacing-md); }
      .ml-lg { margin-left: var(--spacing-lg); }

      .mr-sm { margin-right: var(--spacing-sm); }
      .mr-md { margin-right: var(--spacing-md); }
      .mr-lg { margin-right: var(--spacing-lg); }

      .pt-sm { padding-top: var(--spacing-sm); }
      .pt-md { padding-top: var(--spacing-md); }
      .pt-lg { padding-top: var(--spacing-lg); }

      .pb-sm { padding-bottom: var(--spacing-sm); }
      .pb-md { padding-bottom: var(--spacing-md); }
      .pb-lg { padding-bottom: var(--spacing-lg); }

      .pl-sm { padding-left: var(--spacing-sm); }
      .pl-md { padding-left: var(--spacing-md); }
      .pl-lg { padding-left: var(--spacing-lg); }

      .pr-sm { padding-right: var(--spacing-sm); }
      .pr-md { padding-right: var(--spacing-md); }
      .pr-lg { padding-right: var(--spacing-lg); }

      /* Estados de visibilidad */
      .hidden { display: none !important; }
      .visible { display: block !important; }
      .invisible { visibility: hidden; }

      /* Estados de interacción */
      .disabled {
        opacity: 0.6;
        pointer-events: none;
        cursor: not-allowed;
      }

      .loading {
        position: relative;
        pointer-events: none;
      }

      .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid var(--border-color);
        border-top: 2px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    `;
    
    this.updateStyles(baseStyles);
    this.generateAnimations();
    console.log('StyleEngine: Estilos base generados correctamente');
  }

  // Generar animaciones CSS
  generateAnimations() {
    const animations = `
      @keyframes fadeIn {
        from { 
          opacity: 0; 
          transform: translateY(10px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }

      @keyframes slideIn {
        from { 
          transform: translateX(-100%); 
          opacity: 0;
        }
        to { 
          transform: translateX(0); 
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from { 
          transform: translateX(0); 
          opacity: 1;
        }
        to { 
          transform: translateX(-100%); 
          opacity: 0;
        }
      }

      @keyframes pulse {
        0% { 
          opacity: 1; 
        }
        50% { 
          opacity: 0.5; 
        }
        100% { 
          opacity: 1; 
        }
      }

      @keyframes spin {
        0% { 
          transform: rotate(0deg); 
        }
        100% { 
          transform: rotate(360deg); 
        }
      }

      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          transform: translate3d(0, 0, 0);
        }
        40%, 43% {
          transform: translate3d(0, -8px, 0);
        }
        70% {
          transform: translate3d(0, -4px, 0);
        }
        90% {
          transform: translate3d(0, -2px, 0);
        }
      }

      /* Clases de animación */
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out;
      }

      .animate-slideIn {
        animation: slideIn 0.3s ease-out;
      }

      .animate-slideOut {
        animation: slideOut 0.3s ease-out;
      }

      .animate-pulse {
        animation: pulse 2s infinite;
      }

      .animate-bounce {
        animation: bounce 1s ease-in-out;
      }

      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `;
    
    this.updateStyles(animations);
  }

  // Generar estilos para componentes específicos de Mizu Notes
  generateComponentStyles() {
    console.log('StyleEngine: Generando estilos de componentes...');

    const components = {
      // Contenedor principal
      container: `
        background-color: var(--bg-white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: var(--spacing-xl);
        width: 100%;
        max-width: 800px;
        height: 90vh;
        display: flex;
        flex-direction: column;
        transition: var(--transition);
      `,

      // Toolbar
      toolbar: `
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        flex-wrap: wrap;
        align-items: center;
      `,

      // Botones de toolbar
      toolbarBtn: `
        padding: var(--spacing-sm) var(--spacing-md);
        border: 2px solid var(--primary-color);
        background: transparent;
        color: var(--primary-color);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        font-weight: 600;
        font-size: var(--font-size-sm);
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        
        &:hover {
          background: var(--primary-color);
          color: white;
        }
        
        &:focus {
          outline: 2px solid var(--accent-color);
          outline-offset: 2px;
        }
      `,

      // Estilo para botón cuando el usuario está logeado
      toolbarBtnLoggedIn: `
        background: #4CAF50 !important;
        color: white !important;
        border-color: #45a049 !important;
        
        &:hover {
          background: #45a049 !important;
          transform: translateY(-1px);
        }
      `,

      toolbarBtnPrimary: `
        background: var(--primary-color);
        color: white;
        
        &:hover {
          background: var(--primary-dark);
        }
      `,

      toolbarBtnDanger: `
        border-color: var(--error-color);
        color: var(--error-color);
        
        &:hover {
          background: var(--error-color);
          color: white;
        }
      `,

      // Indicador de estado
      statusIndicator: `
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-left: auto;
        font-size: var(--font-size-sm);
        color: var(--text-light);
      `,

      statusDot: `
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--success-color);
        animation: pulse 2s infinite;
      `,

      statusDotOffline: `
        background: var(--error-color);
      `,

      statusDotSyncing: `
        background: var(--warning-color);
      `,

      // Sidebar de notas
      notesSidebar: `
        width: 250px;
        background: var(--bg-light);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
        margin-right: var(--spacing-md);
        display: flex;
        flex-direction: column;
      `,

      // Lista de notas
      notesList: `
        flex: 1;
        overflow-y: auto;
        margin-bottom: var(--spacing-md);
        
        &::-webkit-scrollbar {
          width: 6px;
        }
        
        &::-webkit-scrollbar-track {
          background: var(--bg-light);
          border-radius: 3px;
        }
        
        &::-webkit-scrollbar-thumb {
          background: var(--primary-color);
          border-radius: 3px;
        }
        
        &::-webkit-scrollbar-thumb:hover {
          background: var(--primary-dark);
        }
      `,

      // Elementos de nota
      noteItem: `
        padding: var(--spacing-sm);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-xs);
        cursor: pointer;
        transition: var(--transition);
        border-left: 4px solid transparent;
        animation: fadeIn 0.3s ease-out;
        
        &:hover {
          background: rgba(67, 97, 238, 0.1);
        }
      `,

      noteItemActive: `
        background: var(--primary-color);
        color: white;
        border-left-color: var(--secondary-color);
      `,

      // Editor de notas
      editorContainer: `
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--bg-light);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
      `,

      // Inputs
      noteTitleInput: `
        background: none;
        border: none;
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--text-dark);
        margin-bottom: var(--spacing-md);
        padding: var(--spacing-sm);
        border-radius: var(--border-radius);
        transition: var(--transition);
        
        &:focus {
          outline: none;
          background: white;
          box-shadow: 0 0 0 2px var(--primary-color);
        }
        
        &:disabled {
          background: var(--bg-dark);
          color: var(--text-light);
          cursor: not-allowed;
        }
      `,

      noteContent: `
        flex: 1;
        background: none;
        border: none;
        resize: none;
        font-size: var(--font-size-md);
        line-height: 1.6;
        color: var(--text-dark);
        padding: var(--spacing-md);
        border-radius: var(--border-radius);
        transition: var(--transition);
        font-family: var(--font-family);
        
        &:focus {
          outline: none;
          background: white;
          box-shadow: 0 0 0 2px var(--primary-color);
        }
        
        &:disabled {
          background: var(--bg-dark);
          color: var(--text-light);
          cursor: not-allowed;
        }
      `,

      // Información de nota
      noteInfo: `
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-light);
        font-size: var(--font-size-xs);
        color: var(--text-light);
        display: flex;
        justify-content: space-between;
      `,

      // Estadísticas
      stats: `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-light);
      `,

      statItem: `
        text-align: center;
      `,

      statNumber: `
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--primary-color);
      `,

      statLabel: `
        font-size: var(--font-size-xs);
        color: var(--text-light);
      `,

      // Búsqueda
      searchBox: `
        position: relative;
        margin-bottom: var(--spacing-md);
      `,

      searchInput: `
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-xl) var(--spacing-sm) var(--spacing-sm);
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: var(--font-size-sm);
        transition: var(--transition);
        
        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      `,

      searchIcon: `
        position: absolute;
        right: var(--spacing-sm);
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-light);
      `,

      // Mensajes
      messageBox: `
        margin-top: var(--spacing-md);
        padding: var(--spacing-sm);
        border-radius: var(--border-radius);
        text-align: center;
        font-weight: 500;
        display: none;
      `,

      messageSuccess: `
        background-color: rgba(75, 181, 67, 0.1);
        color: var(--success-color);
        display: block;
      `,

      messageError: `
        background-color: rgba(230, 57, 70, 0.1);
        color: var(--error-color);
        display: block;
      `,

      messageWarning: `
        background-color: rgba(255, 158, 0, 0.1);
        color: var(--warning-color);
        display: block;
      `,

      // Estados vacíos
      emptyState: `
        text-align: center;
        color: var(--text-light);
        padding: var(--spacing-xl) var(--spacing-md);
      `,

      emptyStateIcon: `
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
        opacity: 0.5;
      `,

      // Indicador de auto-guardado
      autoSave: `
        font-size: var(--font-size-xs);
        color: var(--success-color);
        opacity: 0;
        transition: var(--transition);
      `,

      autoSaveVisible: `
        opacity: 1;
      `,

      // Modal de Login
      loginModal: `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        justify-content: center;
        align-items: center;
      `,

      loginModalActive: `
        display: flex;
      `,

      loginContent: `
        background: var(--bg-white);
        padding: 30px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-hover);
        width: 90%;
        max-width: 400px;
        animation: fadeIn 0.3s ease-out;
      `,

      loginTabs: `
        display: flex;
        margin-bottom: 20px;
        border-bottom: 2px solid var(--bg-light);
      `,

      loginTab: `
        padding: 12px 20px;
        background: none;
        border: none;
        font-weight: 600;
        color: var(--text-light);
        cursor: pointer;
        transition: var(--transition);
      `,

      loginTabActive: `
        color: var(--primary-color);
        border-bottom: 2px solid var(--primary-color);
      `,

      loginForm: `
        display: none;
      `,

      loginFormActive: `
        display: block;
      `,

      formGroup: `
        margin-bottom: 15px;
      `,

      formGroupLabel: `
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        color: var(--text-dark);
      `,

      formGroupInput: `
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: var(--transition);
        
        &:focus {
          outline: none;
          border-color: var(--primary-color);
        }
      `,

      loginBtn: `
        width: 100%;
        padding: 12px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
        
        &:hover {
          background: var(--primary-dark);
        }
      `,

      socialLogin: `
        margin-top: 20px;
        text-align: center;
      `,

      socialBtn: `
        width: 100%;
        padding: 12px;
        margin: 5px 0;
        border: 2px solid #e0e0e0;
        background: white;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        
        &:hover {
          background: var(--bg-light);
        }
      `,

      closeModal: `
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-light);
      `
    };

    // Generar CSS para cada componente
    for (const [component, styles] of Object.entries(components)) {
      this.generateComponentCSS(component, styles);
    }

    this.generateResponsiveStyles();
    console.log('StyleEngine: Estilos de componentes generados correctamente');
  }

  // Generar CSS para un componente específico
  generateComponentCSS(componentName, styles) {
    const selectors = {
      container: '.container',
      toolbar: '.toolbar',
      toolbarBtn: '.toolbar-btn',
      toolbarBtnLoggedIn: '.toolbar-btn.logged-in',
      toolbarBtnPrimary: '.toolbar-btn.primary',
      toolbarBtnDanger: '.toolbar-btn.danger',
      statusIndicator: '.status-indicator',
      statusDot: '.status-dot',
      statusDotOffline: '.status-dot.offline',
      statusDotSyncing: '.status-dot.syncing',
      notesSidebar: '.notes-sidebar',
      notesList: '.notes-list',
      noteItem: '.note-item',
      noteItemActive: '.note-item.active',
      editorContainer: '.editor-container',
      noteTitleInput: '.note-title-input',
      noteContent: '.note-content',
      noteInfo: '.note-info',
      stats: '.stats',
      statItem: '.stat-item',
      statNumber: '.stat-number',
      statLabel: '.stat-label',
      searchBox: '.search-box',
      searchInput: '.search-input',
      searchIcon: '.search-icon',
      messageBox: '#messageBox',
      messageSuccess: '.message-success',
      messageError: '.message-error',
      messageWarning: '.message-warning',
      emptyState: '.empty-state',
      emptyStateIcon: '.empty-state-icon',
      autoSave: '.auto-save',
      autoSaveVisible: '.auto-save.visible',
      loginModal: '.login-modal',
      loginModalActive: '.login-modal.active',
      loginContent: '.login-content',
      loginTabs: '.login-tabs',
      loginTab: '.login-tab',
      loginTabActive: '.login-tab.active',
      loginForm: '.login-form',
      loginFormActive: '.login-form.active',
      formGroup: '.form-group',
      formGroupLabel: '.form-group label',
      formGroupInput: '.form-group input',
      loginBtn: '.login-btn',
      socialLogin: '.social-login',
      socialBtn: '.social-btn',
      closeModal: '.close-modal'
    };

    const selector = selectors[componentName] || `.${componentName}`;
    const css = `${selector} { ${styles} }`;
    this.updateStyles(css);
  }

  // Generar estilos responsivos
  generateResponsiveStyles() {
    const responsiveStyles = `
      @media (max-width: 768px) {
        .container {
          height: auto;
          min-height: 90vh;
          padding: var(--spacing-md);
        }
        
        .main-content {
          flex-direction: column;
        }
        
        .notes-sidebar {
          width: 100%;
          margin-right: 0;
          margin-bottom: var(--spacing-md);
          max-height: 300px;
        }
        
        .toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        
        .status-indicator {
          margin-left: 0;
          justify-content: center;
        }
        
        .note-info {
          flex-direction: column;
          gap: var(--spacing-sm);
          text-align: center;
        }
        
        .login-content {
          width: 95%;
          padding: 20px;
        }
      }

      @media (max-width: 480px) {
        body {
          padding: var(--spacing-sm);
        }
        
        .container {
          padding: var(--spacing-md);
          height: 95vh;
        }
        
        .toolbar-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--font-size-xs);
        }
        
        .note-title-input {
          font-size: var(--font-size-lg);
        }
        
        .stats {
          grid-template-columns: 1fr;
          gap: var(--spacing-xs);
        }
        
        .login-content {
          width: 98%;
          padding: 15px;
        }
        
        .login-tab {
          padding: 8px 15px;
          font-size: var(--font-size-sm);
        }
      }
    `;

    this.updateStyles(responsiveStyles);
  }

  // Registrar un tema personalizado
  registerTheme(name, themeVariables) {
    this.themes.set(name, themeVariables);
    console.log(`StyleEngine: Tema '${name}' registrado`);
  }

  // Aplicar un tema
  applyTheme(name) {
    if (!this.themes.has(name)) {
      console.warn(`StyleEngine: El tema '${name}' no existe`);
      return false;
    }
    
    const themeVariables = this.themes.get(name);
    let themeCSS = ':root {';
    
    for (const [variable, value] of Object.entries(themeVariables)) {
      themeCSS += `--${variable}: ${value};`;
    }
    
    themeCSS += '}';
    
    this.updateStyles(themeCSS);
    this.currentTheme = name;
    console.log(`StyleEngine: Tema '${name}' aplicado`);
    
    return true;
  }

  // Crear temas predefinidos
  createDefaultThemes() {
    // Tema Oscuro
    this.registerTheme('dark', {
      'primary-color': '#6366f1',
      'primary-dark': '#4f46e5',
      'secondary-color': '#8b5cf6',
      'accent-color': '#06b6d4',
      'text-dark': '#f8fafc',
      'text-light': '#cbd5e1',
      'bg-light': '#1e293b',
      'bg-white': '#0f172a',
      'bg-dark': '#334155',
      'border-color': '#475569',
      'shadow-color': 'rgba(0, 0, 0, 0.3)'
    });

    // Tema Verde
    this.registerTheme('green', {
      'primary-color': '#10b981',
      'primary-dark': '#059669',
      'secondary-color': '#047857',
      'accent-color': '#06d6a0',
      'success-color': '#059669'
    });

    // Tema Rosa
    this.registerTheme('pink', {
      'primary-color': '#ec4899',
      'primary-dark': '#db2777',
      'secondary-color': '#be185d',
      'accent-color': '#f472b6'
    });

    console.log('StyleEngine: Temas predefinidos creados');
  }

  // Actualizar los estilos en el DOM
  updateStyles(css) {
    this.styleElement.textContent += css;
  }

  // Limpiar todos los estilos
  clearStyles() {
    this.styleElement.textContent = '';
    console.log('StyleEngine: Estilos limpiados');
  }

  // Obtener el tema actual
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Obtener todos los temas registrados
  getRegisteredThemes() {
    return Array.from(this.themes.keys());
  }

  // Inicializar completamente el motor de estilos
  initialize() {
    this.generateBaseStyles();
    this.generateComponentStyles();
    this.createDefaultThemes();
    console.log('StyleEngine: Inicialización completada');
  }
}