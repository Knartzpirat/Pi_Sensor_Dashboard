# Raspberry Pi Sensor Dashboard - UI Components TODO List

## Umfassende Liste aller UI-Komponenten für das Raspberry Pi Sensor-Datensammlung-System

Diese Datei enthält eine vollständige Übersicht aller TODO-Kommentare für UI-Komponenten des Raspberry Pi Sensor Dashboards. Das System sammelt Sensordaten über GPIO und HAT-Verbindungen, überträgt diese via FastAPI/WebSocket an Next.js und speichert sie in einer Datenbank.

## 🍓 Raspberry Pi Spezifische Komponenten

### Hardware Konfiguration (`components/settings/raspberry-pi/`)

- [ ] `flexible-hardware-configurator.tsx` - Adaptive Hardware-Konfiguration (GPIO/Custom Board/I2C)
- [ ] `connection-type-selector.tsx` - Auswahl zwischen direkten GPIO-Pins, Custom Board, I2C/SPI
- [ ] `hardware-detection.tsx` - Automatische Erkennung angeschlossener Hardware
- [ ] `sampling-settings.tsx` - Messintervalle und Datensammlung
- [ ] `hardware-diagnostics.tsx` - System- und Hardware-Diagnose

### Bereits vorhanden aber veraltet (zu entfernen):

- [x] ~~`gpio-pin-configurator.tsx`~~ - ⚠️ Veraltet, durch flexible-hardware-configurator ersetzen
- [x] ~~`sensor-hardware-settings.tsx`~~ - ⚠️ Veraltet, in flexible-hardware-configurator integrieren
- [x] ~~`data-stream-config.tsx`~~ - ⚠️ Entfernt, da hard-coded
- [x] ~~`fastapi-connection.tsx`~~ - ⚠️ Entfernt, da hard-coded

### Dashboard Komponenten (`components/dashboard/`)

- [ ] `raspberry-pi-system-status.tsx` - Pi Hardware-Status und Metriken
- [ ] `live-sensor-charts.tsx` - Echtzeit-Sensordaten Visualisierung
- [ ] `gpio-status-widget.tsx` - GPIO-Pin Status Übersicht

## 🏠 Dashboard Komponenten

### Haupt-Dashboard (`app/dashboard/page.tsx`)

- [ ] `components/dashboard/raspberry-pi-stats.tsx` - Pi Hardware-Status, GPIO Nutzung, System-Metriken
- [ ] `components/dashboard/live-sensor-charts.tsx` - Echtzeit-Sensordaten mit Umgebungskontext
- [ ] `components/dashboard/raspberry-pi-system-status.tsx` - Hardware-Info, GPIO Status, FastAPI Health

## 🏢 Umgebungskontext Management (Measurement Objects)

### Environment Context (`components/measurement-objects/`)

- [x] ~~`environment-context-manager.tsx`~~ - ✅ Bereits implementiert (`components/test-objects/environment-context-manager.tsx`)
- [x] ~~`create-environment-dialog.tsx`~~ - ✅ Bereits implementiert (`components/test-objects/create-environment-dialog.tsx`)
- [x] ~~`sensor-environment-assignment.tsx`~~ - ✅ Bereits implementiert (`components/test-objects/sensor-environment-assignment.tsx`)
- [x] ~~`environment-context-measurements.tsx`~~ - ✅ Bereits implementiert (`components/test-objects/environment-context-measurements.tsx`)
- [ ] `environment-templates.tsx` - Vordefinierte Messumgebungs-Vorlagen
- [ ] `environment-analytics.tsx` - Umgebungsspezifische Messanalysen und Vergleiche

### Umgebungstyp-Beispiele:

**Temperatur-Kontexte:** Kühlkammer (-20°C bis 5°C), Innenraum (18°C bis 25°C), Draußen (-30°C bis 50°C)
**Geschwindigkeits-Kontexte:** Auto (0-200 km/h), Fahrrad (0-50 km/h), Fußgänger (0-15 km/h)  
**Druck-Kontexte:** Meereshöhe (1013 hPa), Berge (< 1013 hPa), Druckkammer (> 1013 hPa)

## 🧭 Navigation & Layout

### Navbar (`components/app-navbar.tsx`)

- [x] ~~`components/navbar/global-search.tsx`~~ - ✅ Bereits implementiert
- [x] ~~`components/navbar/notifications.tsx`~~ - ✅ Bereits implementiert
- [ ] `components/navbar/user-menu.tsx` - Avatar mit Benutzer-Menü

### Sidebar (`components/app-sidebar/index.tsx`)

- [ ] `components/sidebar/sensor-status-widget.tsx` - Online/Offline Sensor-Anzeige
- [ ] `components/sidebar/recent-alerts-widget.tsx` - Kritische Alerts kompakt
- [ ] `components/sidebar/quick-stats-widget.tsx` - Mini-Charts, aktuelle Werte

### Layout (`app/layout.tsx`)

- [ ] `components/layout/loading-provider.tsx` - Globale Loading-States
- [ ] `components/layout/error-boundary.tsx` - Fehlerbehandlung
- [ ] `components/layout/websocket-provider.tsx` - Real-time Updates
- [ ] `components/layout/analytics-provider.tsx` - User Analytics
- [ ] `components/layout/keyboard-shortcuts.tsx` - Globale Shortcuts

## 📊 Neue Seiten

### Measurements Page (`app/dashboard/measurements/page.tsx`)

- [ ] `components/measurements/measurements-table.tsx` - Haupttabelle mit durchgeführten Messungen
- [ ] `components/measurements/measurement-detail-drawer.tsx` - Detailansicht mit Grafen beim Auswählen
- [ ] `components/measurements/measurement-filters.tsx` - Filter für Datum, Sensoren, Umgebung
- [ ] `components/measurements/measurement-comparison-dialog.tsx` - Vergleich zwischen mehreren Messungen
- [ ] `components/measurements/measurement-chart.tsx` - Einzelne Messung als Graf (Line/Area Chart)
- [ ] `components/measurements/comparison-charts.tsx` - Mehrere Messungen übereinander/nebeneinander
- [ ] `components/measurements/measurement-export-dialog.tsx` - Export von Messdaten (CSV/JSON/PDF)
- [ ] `components/measurements/measurement-stats-cards.tsx` - Statistiken über Messungen (Anzahl, Durchschnitt, etc.)
- [ ] `hooks/use-measurements-data.tsx` - Custom Hook für Messungen laden und filtern
- [ ] `hooks/use-measurement-comparison.tsx` - Custom Hook für Messungsvergleich State

### Reports Page (`app/dashboard/reports/page.tsx`)

- [ ] `components/reports/report-builder.tsx` - Report-Konfigurations-Interface
- [ ] `components/reports/report-preview.tsx` - Live Report-Vorschau
- [ ] `components/reports/export-options.tsx` - PDF/Excel Export
- [ ] `components/reports/report-templates.tsx` - Vordefinierte Templates
- [ ] `components/reports/scheduled-reports.tsx` - Geplante Reports
- [ ] `components/reports/report-history.tsx` - Report-Verlauf

### Sensors Page (`app/dashboard/sensors/page.tsx`)

- [ ] `components/sensors/sensor-list.tsx` - Hardware-unabhängige Sensor-Übersicht
- [x] ~~`components/sensors/sensor-card.tsx`~~ - ✅ Bereits implementiert
- [ ] `components/sensors/connection-type-selector.tsx` - GPIO/Board/I2C Auswahl
- [ ] `components/sensors/flexible-port-mapping.tsx` - Adaptiert sich an Hardware-Typ
- [ ] `components/sensors/hardware-detection.tsx` - Auto-Detection verschiedener Boards
- [ ] `components/sensors/setup-wizard.tsx` - Guided Hardware Setup für verschiedene Konfigurationen
- [x] ~~`components/sensors/add-sensor-dialog.tsx`~~ - ✅ Bereits implementiert
- [ ] `components/sensors/edit-sensor-dialog.tsx` - Sensor bearbeiten mit flexibler Port-Zuordnung
- [ ] `components/sensors/sensor-diagnostics.tsx` - Universal Diagnose für alle Hardware-Typen
- [ ] `components/sensors/sensor-calibration.tsx` - Kalibrierung unabhängig von Anschluss-Art
- [ ] `components/sensors/bulk-actions-toolbar.tsx` - Bulk-Operationen
- [ ] `components/sensors/sensor-status-badge.tsx` - Status-Anzeigen mit Hardware-Info

### Settings Page (`app/dashboard/settings/page.tsx`)

**APIs bereits vorhanden (✅):**

- [x] ~~Change Password API~~ - `/api/settings/change-password`
- [x] ~~Change Username API~~ - `/api/settings/change-username`

**UI Komponenten noch zu implementieren:**

- [ ] `components/settings/settings-navigation.tsx` - Settings-Kategorien Navigation
- [ ] `components/settings/user-profile-settings.tsx` - Benutzerprofil mit bestehenden APIs
- [ ] `components/settings/system-settings.tsx` - System-Konfiguration
- [ ] `components/settings/notification-settings.tsx` - Benachrichtigungen
- [ ] `components/settings/security-settings.tsx` - Sessions, API Keys
- [ ] `components/settings/backup-settings.tsx` - Backup & Restore
- [ ] `components/settings/integration-settings.tsx` - Webhooks, APIs
- [ ] `components/settings/maintenance-tools.tsx` - Logs, Diagnostik

**Fehlende APIs für Settings:**

- [ ] `/api/settings/notifications` - Benachrichtigungseinstellungen
- [ ] `/api/settings/system` - System-Konfiguration
- [ ] `/api/settings/backup` - Backup/Restore Operations

## 📈 Chart-Komponenten

### Basis-Charts (`components/charts/`)

- [x] ~~`components/charts/line-chart.tsx`~~ - ✅ Bereits implementiert
- [x] ~~`components/charts/gauge-chart.tsx`~~ - ✅ Bereits implementiert
- [ ] `components/charts/bar-chart.tsx` - Balkendiagramme für Vergleiche
- [ ] `components/charts/area-chart.tsx` - Flächendiagramme für Trends
- [ ] `components/charts/heatmap-chart.tsx` - Heatmaps für Sensor-Verteilungen

## 🔧 Measurement Objects Erweiterungen

### Measurement Objects (`app/dashboard/measurement-objects/page.tsx`)

**APIs bereits vorhanden (✅):**

- [x] ~~Test-Objects CRUD~~ - `/api/test-objects` (kann als Measurement Objects verwendet werden)

**UI Komponenten noch zu implementieren:**

- [ ] `components/measurement-objects/measurement-objects-header.tsx` - Header mit Bulk-Aktionen
- [ ] `components/measurement-objects/analytics-cards.tsx` - Messstatistiken
- [ ] `components/measurement-objects/batch-operations.tsx` - Bulk Edit/Delete
- [ ] `components/measurement-objects/measurement-scheduler.tsx` - Geplante Messungen
- [ ] `components/measurement-objects/measurement-history.tsx` - Messungsverlauf

## 🔐 Authentifizierung & Setup (Single-User System)

### Login System (`app/login/page.tsx`)

**Bereits implementiert (✅):**

- [x] ~~`components/form/login-form.tsx`~~ - ✅ Vollständiges Login-Formular
- [x] ~~Login/Logout APIs~~ - `/api/auth/login`, `/api/auth/logout`
- [x] ~~Password Reset API~~ - `/api/auth/reset-password`
- [x] ~~Recovery Codes API~~ - `/api/auth/verify-recovery-code`
- [x] ~~Recovery Code Form~~ - `components/form/recoverycode-form.tsx`
- [x] ~~Reset Password Form~~ - `components/form/resetpassword-form.tsx`

**UI Komponenten noch zu implementieren:**

- [ ] `components/auth/session-management.tsx` - Sitzungsverwaltung und Auto-Logout
- [ ] `components/auth/password-reset-wizard.tsx` - Geführter Reset-Process
- [ ] `components/auth/security-settings.tsx` - Lokale Sicherheitseinstellungen UI

### Setup System (`app/setup/page.tsx`)

**Bereits implementiert (✅):**

- [x] ~~`components/form/setup-form.tsx`~~ - ✅ Vollständiges Setup-Formular mit DB-Konfiguration
- [x] ~~Setup API~~ - `/api/setup` (Multi-Step Setup mit Progress)
- [x] ~~Recovery Codes Page~~ - `app/setup/recovery-codes/page.tsx`

**Setup-Erweiterungen für Raspberry Pi:**

- [ ] `components/setup/hardware-detection-step.tsx` - Hardware-Erkennung während Setup
- [ ] `components/setup/sensor-configuration-wizard.tsx` - Sensor-Setup im Initial-Setup
- [ ] `components/setup/system-test-step.tsx` - System-Test (GPIO, FastAPI, Database)
- [ ] `components/setup/setup-progress-tracker.tsx` - Erweiterte Progress-Anzeige
- [ ] `components/setup/setup-summary.tsx` - Setup-Zusammenfassung vor Abschluss

**Setup-APIs Erweiterungen:**

- [ ] `/api/setup/hardware-detection` - Hardware-Scan während Setup
- [ ] `/api/setup/test-connection` - FastAPI/GPIO/DB Connection Tests
- [ ] `/api/setup/verify-system` - System-Readiness Check

## 🎨 UI Primitive Komponenten

### Forms (`components/forms/`)

- [x] ~~`components/forms/date-range-picker.tsx`~~ - ✅ Bereits implementiert
- [x] ~~`components/forms/multi-select.tsx`~~ - ✅ Bereits implementiert
- [ ] `components/forms/sensor-form.tsx` - Flexible Sensor-Konfiguration für verschiedene Hardware
- [ ] `components/forms/settings-form.tsx` - Settings-Formulare
- [ ] `components/forms/multi-file-upload.tsx` - Wiederverwendbare Multi-File-Upload Komponente
- [ ] `components/forms/file-type-filter.tsx` - File-Type Filter und Sortierung

### UI Primitives (`components/ui/`)

- [x] ~~`components/ui/color-picker.tsx`~~ - ✅ Bereits implementiert
- [ ] `components/ui/data-grid.tsx` - Erweiterte Tabelle mit Editing
- [ ] `components/ui/tree-view.tsx` - Hierarchische Datenstruktur
- [ ] `components/ui/timeline.tsx` - Ereignis-Timeline
- [ ] `components/ui/stats-card.tsx` - Wiederverwendbare Statistik-Karten
- [ ] `components/ui/status-indicator.tsx` - Status-Badges und -Icons
- [ ] `components/ui/breadcrumb-nav.tsx` - Navigation-Breadcrumbs
- [ ] `components/ui/empty-state.tsx` - Leere Zustände mit Aktionen

### Code Refactoring UI Components (aus bestehenden Dateien extrahieren)

- [ ] `components/ui/image-thumbnail-preview.tsx` - Wiederverwendbare Thumbnail-Komponente mit Preview-Dialog
- [ ] `components/ui/image-carousel-dialog.tsx` - Modal mit Carousel für Bildergalerien
- [ ] `components/ui/truncated-text-popover.tsx` - Wiederverwendbare Komponente für abgeschnittenen Text mit Popover
- [ ] `components/ui/label-badge.tsx` - Wiederverwendbare Label-Badge mit Farb-Support
- [ ] `components/ui/table-row-actions.tsx` - Wiederverwendbare Row-Actions mit Edit/Delete Buttons
- [ ] `components/ui/inline-textarea-editor.tsx` - Wiederverwendbare inline-editable Textarea mit Auto-Save
- [ ] `components/ui/sortable-image-grid.tsx` - Wiederverwendbare sortierbare Bildergalerie
- [ ] `components/ui/image-item.tsx` - Einzelne Bildkarte mit Context Menu und Drag Handle
- [ ] `components/ui/sortable-document-list.tsx` - Wiederverwendbare sortierbare Dokumentenliste
- [ ] `components/ui/document-item.tsx` - Einzelnes Dokument mit inline-edit Name und Context Menu
- [ ] `components/ui/upload-progress-bar.tsx` - Upload-Progress Indikator

## 🔄 Real-time & Advanced Features

### Real-time Components

- [x] ~~`components/realtime/websocket-provider.tsx`~~ - ✅ Bereits implementiert (`components/providers/websocket-provider.tsx`)
- [ ] `components/realtime/live-updates.tsx` - Live-Daten Updates
- [ ] `components/realtime/connection-status.tsx` - Verbindungsstatus

### Advanced Features

- [ ] `components/export/pdf-generator.tsx` - PDF-Generierung
- [ ] `components/export/excel-exporter.tsx` - Excel-Export
- [ ] `components/accessibility/keyboard-nav.tsx` - Tastatur-Navigation
- [ ] `components/accessibility/screen-reader.tsx` - Screen Reader Support

### Custom Hooks

- [ ] `hooks/use-carousel-state.tsx` - Custom Hook für Carousel-Status und Navigation
- [ ] `hooks/use-row-edit-state.tsx` - Custom Hook für Row-Edit State Management
- [ ] `hooks/use-file-upload-state.tsx` - Custom Hook für File-Upload State Management
- [ ] `hooks/use-form-loading-state.tsx` - Bessere Lösung für Form Loading State ohne Polling
- [ ] `hooks/use-table-persistence.tsx` - Custom Hook für Table State Persistence (Cookies)
- [ ] `hooks/use-table-configuration.tsx` - Table Configuration Hook für Standard-Settings
- [ ] `hooks/use-inline-edit.tsx` - Custom Hook für Inline-Edit State und Auto-Save Logic
- [ ] `hooks/use-test-object-data.tsx` - Custom Hook für Test-Object Data Loading
- [ ] `hooks/use-labels-data.tsx` - Custom Hook für Labels Loading und Caching
- [ ] `hooks/use-test-object-mutations.tsx` - Custom Hook für Test-Object Update Operations
- [ ] `hooks/use-file-upload.tsx` - Custom Hook für File-Upload mit Progress und Error Handling
- [ ] `hooks/use-delete-confirmation.tsx` - Custom Hook für Delete-Dialoge mit Confirmation

### API Services & Endpoints

**Bereits vorhanden (✅):**

- [x] ~~`/api/auth/*`~~ - Login, Logout, Reset-Password, Recovery-Codes
- [x] ~~`/api/test-objects/*`~~ - Test-Object CRUD Operations
- [x] ~~`/api/pictures/*`~~ - Picture Management mit Reorder
- [x] ~~`/api/documents/*`~~ - Document Management
- [x] ~~`/api/labels/*`~~ - Label Management
- [x] ~~`/api/uploads`~~ - File Upload Operations
- [x] ~~`/api/settings/*`~~ - User Settings (Password, Username)

**Noch zu implementieren:**

- [ ] `/api/sensors` - Sensor-Management und Hardware-Detection
- [ ] `/api/measurements` - Messungen CRUD und Daten-Export
- [ ] `/api/reports` - Report-Generierung und Templates
- [ ] `/api/hardware` - Raspberry Pi Hardware-Status und Konfiguration
- [ ] `/api/system` - System-Status, GPIO, Performance-Metriken

**Client Services:**

- [x] ~~`services/fastapi-service.ts`~~ - ✅ Bereits implementiert
- [ ] `services/sensor-api.ts` - Client Service für Sensor Operations
- [ ] `services/measurement-api.ts` - Client Service für Measurements
- [ ] `services/hardware-api.ts` - Client Service für Hardware Detection

## 📱 Mobile & Responsive

### Mobile Optimierung

- [ ] `components/mobile/mobile-nav.tsx` - Mobile Navigation
- [ ] `components/mobile/swipe-gestures.tsx` - Touch-Gesten
- [ ] `components/mobile/mobile-charts.tsx` - Mobile-optimierte Charts

## 🔍 Search & Filter

### Advanced Search

- [ ] `components/search/fuzzy-search.tsx` - Unscharfe Suche
- [ ] `components/search/search-filters.tsx` - Erweiterte Filter
- [ ] `components/search/saved-searches.tsx` - Gespeicherte Suchen

---

## Implementierungs-Prioritäten

### Hoch (Core Features) - Für Raspberry Pi Sensor Dashboard

1. **Hardware-Management** - Sensor Detection & Konfiguration
2. **Measurements Page** - Durchgeführte Messungen anzeigen und vergleichen
3. **Dashboard Charts** - Live-Sensor-Daten Visualisierung
4. **API Endpoints** - `/api/sensors`, `/api/measurements`, `/api/hardware`
5. **Real-time Updates** - WebSocket für Live-Sensordaten

### Medium (Enhanced UX)

1. **Reports System** - PDF/Excel Export von Messdaten
2. **Settings Interface** - Hardware-Konfiguration UI
3. **Mobile Optimierung** - Touch-freundliche Sensor-Bedienung
4. **Code Refactoring** - UI Components aus bestehenden Dateien extrahieren

### Niedrig (Nice-to-Have)

1. **Advanced Analytics** - Sensor-Trends und Vorhersagen
2. **Accessibility Features** - Screen Reader Support
3. **Batch-Operationen** - Bulk-Sensor-Management

## API-Status Übersicht

**✅ Implementiert:** Auth, Test-Objects, Files, Settings (Basis)
**🔄 Teilweise:** Dashboard Components, Charts  
**❌ Fehlend:** Sensors, Measurements, Hardware, Reports, System

Jede Komponente sollte:

- TypeScript-typisiert sein
- Responsive Design haben
- Accessibility-Standards erfüllen
- Internationalisierung unterstützen
- Loading/Error States behandeln
- Unit Tests besitzen
