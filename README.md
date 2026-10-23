## Export Software Frontend

Built on top of [fe-zen-arch](git@github.com:shivamkj/fe-zen-arch.git) — the core shared architecture for B2B SaaS frontends.

---

### Refactoring Highlights & Architecture

The Shipping Bill creation form and related modules have been refactored to achieve production-grade maintainability, clear separation of concerns, and API readiness:

1. **Modular Component Architecture**:
   - Decomposed the previous 1,760-line monolithic `shipping-bill-form.tsx` into focused, single-responsibility components under `src/shipping-bills/components/`:
     - `components/tabs/shipment-details-tab.tsx`: Shipment basics, exporter & consignee party selectors, port routing, and packaging details.
     - `components/tabs/invoices-goods-tab.tsx`: Commercial invoices, charge breakdowns (freight, insurance, commission, discounts), currency syncing, and line items.
     - `components/tabs/goods-item-row.tsx`: Individual goods tariff declaration, scheme codes, duty drawback rules, and auto-calculations.
     - `components/tabs/other-details-tab.tsx`: Containers, packing list sequence ranges, supporting documents (e-Sanchit), and export licenses.
     - `components/party-selector.tsx`: Reusable dual Party + Branch asynchronous combobox selector with automated branch invalidation.
     - `components/workflow-stepper.tsx`: Interactive, responsive top progress indicator for export workflow stages.
     - `components/common/async-combobox.tsx`: Robust, accessible async searchable dropdown supporting debouncing, loading, empty, and error states.
     - `components/common/advanced-panel.tsx`: Accessible collapsible sections with smooth state toggling.
     - `components/bill-editor.tsx`: Orchestrates form state, validation schemas, tab navigation, and persistence.
     - `shipping-bill-form.tsx`: Clean route-level entry point delegating to `BillEditor`.

2. **API-Ready Mock Service Layer**:
   - Replaced all direct component imports of static hardcoded arrays (`schemeCodes`, `documentCodes`, `quantityCodes`, `stateOptions`, `Trades`, `cargoOptions`, `weightUnits`, `sealTypes`, `contractTypes`, `ports`, etc.) with asynchronous, Promise-based mock services:
     - `services/reference-data-service.ts`: Asynchronously serves tariff codes, scheme codes, document types, ports, currencies, and customs options with simulated latency, query filtering, and empty-state handling.
     - `services/party-service.ts`: Asynchronously manages searching and resolving exporters, consignees, buyers, and branch addresses.
     - `services/shipping-bill-service.ts`: Asynchronously handles listing, saving, and downloading ICEGATE flat files (`.sb`).
     - `hooks/use-reference-options.ts`: Reusable hook managing `{ data, isLoading, isError, error, reload }` states cleanly outside of UI components.
   - Any real REST or GraphQL endpoint can replace these mock services with zero changes to UI components.

3. **Domain Handling & Business Validation Rules**:
   - **Weight Integrity Rule**: Gross weight must be greater than or equal to Net weight (`grossWeight >= netWeight`). A real-time validation indicator alerts the user if net weight exceeds gross weight.
   - **Automated Calculations**: Line totals are calculated in real time (`quantity * unitPrice`) while allowing manual overrides. Invoice totals automatically reflect the sum of goods items and applicable charges.
   - **Party Synchronization**: The "Buyer & consignee are the same entity" toggle automatically synchronizes the buyer ID and branch from the selected consignee, reducing data entry errors and form clutter.
   - **Customs Scheme Code Rules**: Duty drawback, RoSCTL, and RoDTEP serial numbers and quantities are dynamically displayed only when the selected scheme supports export incentives.
   - **Port Routing**: Origin port enforces Indian loading ports (`IN...`), destination ports validate distinct international entry points, and discharge port defaults to the destination port when unspecified.

---

### AI Usage & Approach

- **Tools Used**:
  - Google Gemini 3.8 via Antigravity Agentic Assistant.
- **How They Were Used**:
  - Used for rapid codebase exploration, diagnosing missing submodule dependencies (`fe-zen-arch`), identifying existing TypeScript compilation errors, structuring modular components, and writing Promise-based mock service layers.
- **Architectural & Engineering Judgment**:
  - **No New Dependencies**: Adhered strictly to the constraint of not adding external packages (like Zod or Lodash). Leveraged the workspace's built-in `fe-zen-arch` validator (`s`) and UI components.
  - **Zero Loss of Existing Functionality**: Verified that all fields, ICEGATE schema mappings, flat-file generation, quick-add party dialogs, and local storage demo stores remained 100% operational.
  - **Pragmatic Refactoring over Rewrites**: Retained the core React Hook Form context and route contracts while extracting components cleanly into modular sub-files.
  - **Cross-Platform Compatibility**: Fixed the build script to run seamlessly on both Windows and Unix environments without environment-specific bash prefixes.
- **Learnings & Validation**:
  - Validated with `npx tsc --noEmit` (0 errors), `pnpm build` (production Vite bundle build passing), and local runtime dev server verification (`pnpm dev`).

---

### Setup & Running

```bash
# 1. Install dependencies across the workspace
pnpm install

# 2. Start the local dev server (port 5173)
pnpm dev

# 3. Type check with TypeScript compiler (zero errors)
npx tsc --noEmit

# 4. Production build
pnpm build
```

---

### Notes

- `core`, `ui`, `auth`, `icons` are fe-zen-arch workspace packages, aliased via `tsconfig` paths & `vite` aliases.
- Forms are built directly with `useForm` from `core/form` + `Form` from `core/form/components`.
- Routing uses fe-zen-arch's router: routes defined in `src/shared/routes.tsx`, paths in `src/shared/route-paths.ts`.
- API base URL comes from `PUBLIC_API_URL` (`.env`).

