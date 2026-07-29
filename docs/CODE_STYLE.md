# Estilo de Código y Buenas Prácticas — Ruedalo CODE STYLE

Este documento define las reglas obligatorias de codificación para asegurar la legibilidad, mantenimiento y consistencia del código de **Ruedalo.app**.

---

## 🛠️ Reglas Generales

1.  **TypeScript Estricto:** Toda variable, parámetro, propiedad de componente o retorno de función debe estar debidamente tipado. No se permite el uso del tipo `any` de forma genérica.
2.  **No Duplicar Lógica (DRY):** Antes de crear un componente, hook o servicio, revisa si existe uno reutilizable en `src/components/ruedalo/` o `src/hooks/`.
3.  **Componentes Reutilizables:** Todos los elementos interactivos deben usar los bordes redondeados consistentes de **`20px`** (`borderRadius: 20`) y las fuentes oficiales Poppins definidos en `src/lib/theme.ts`.
4.  **No Lógica de Negocio en Cliente:** Prohibido calcular tarifas, comisiones o bonos directamente en el frontend móvil. Toda escritura transaccional o cálculo financiero sensible debe ejecutarse exclusivamente en Cloud Functions.
