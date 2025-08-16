# Branch Protection Setup

Para proteger el main branch de Mizu Notes, sigue estos pasos:

## 1. Configurar Branch Protection Rules

Ve a tu repositorio en GitHub:
1. **Settings** → **Branches**
2. **Add rule** para el branch `main`
3. **Configure** las siguientes opciones:

### ✅ **Required checks to pass before merging:**
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- ✅ **Status checks that are required:**
  - `Test and Validate` (el workflow que acabamos de crear)

### ✅ **Restrict pushes that create files:**
- ✅ **Restrict pushes that create files that match a specified pattern**
- ✅ **Pattern:** `*.exe`, `*.dll`, `*.so`, `*.dylib`

### ✅ **Restrict deletions:**
- ✅ **Restrict deletions**
- ✅ **Restrict force pushes**

### ✅ **Additional restrictions:**
- ✅ **Require a pull request before merging**
- ✅ **Require approvals:** `1` (o más según tu preferencia)
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require review from code owners**

## 2. Configurar Code Owners

Crea un archivo `.github/CODEOWNERS`:

```txt
# Code owners for Mizu Notes
* @mizulegendsstudios
```

## 3. Configurar Dependabot (Opcional)

Para mantener las dependencias actualizadas, crea `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

## 4. Resultado

Con esta configuración:
- ✅ **Ningún código se puede mergear** sin que pasen los tests
- ✅ **Se requieren pull requests** para cambios en main
- ✅ **Se requieren reviews** antes de mergear
- ✅ **El main branch está protegido** contra cambios directos
- ✅ **Los tests se ejecutan automáticamente** en cada PR

## 5. Flujo de trabajo recomendado

1. **Crear feature branch:** `git checkout -b feature/nueva-funcionalidad`
2. **Desarrollar y testear** localmente
3. **Push y crear PR:** `git push origin feature/nueva-funcionalidad`
4. **Los tests se ejecutan automáticamente**
5. **Review del código** por parte del equipo
6. **Merge solo si** los tests pasan y hay approval

---

**Nota:** Esta configuración protege tu main branch y asegura que solo código validado llegue a producción.