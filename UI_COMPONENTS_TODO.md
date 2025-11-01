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

- [ ] `environment-context-manager.tsx` - Hauptinterface für Umgebungsverwaltung
- [ ] `create-environment-dialog.tsx` - Dialog zum Erstellen neuer Messumgebungen
- [ ] `sensor-environment-assignment.tsx` - Drag & Drop Sensor-zu-Umgebung Zuordnung
- [ ] `environment-context-measurements.tsx` - Messwerte nach Umgebungskontext gruppiert
- [ ] `environment-templates.tsx` - Vordefinierte Messumgebungs-Vorlagen
- [ ] `environment-analytics.tsx` - Umgebungsspezifische Messanalysen und Vergleiche

### Umgebungstyp-Beispiele:

**Temperatur-Kontexte:** Kühlkammer (-20°C bis 5°C), Innenraum (18°C bis 25°C), Draußen (-30°C bis 50°C)
**Geschwindigkeits-Kontexte:** Auto (0-200 km/h), Fahrrad (0-50 km/h), Fußgänger (0-15 km/h)  
**Druck-Kontexte:** Meereshöhe (1013 hPa), Berge (< 1013 hPa), Druckkammer (> 1013 hPa)

## 🧭 Navigation & Layout

### Navbar (`components/app-navbar.tsx`)

- [ ] `components/navbar/global-search.tsx` - Globale Suche mit Cmd+K Shortcut
- [ ] `components/navbar/notifications.tsx` - Bell-Icon mit Alert-Dropdown
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
- [ ] `components/sensors/sensor-card.tsx` - Einzelne Sensor-Karte mit Live-Status
- [ ] `components/sensors/connection-type-selector.tsx` - GPIO/Board/I2C Auswahl
- [ ] `components/sensors/flexible-port-mapping.tsx` - Adaptiert sich an Hardware-Typ
- [ ] `components/sensors/hardware-detection.tsx` - Auto-Detection verschiedener Boards
- [ ] `components/sensors/setup-wizard.tsx` - Guided Hardware Setup für verschiedene Konfigurationen
- [ ] `components/sensors/add-sensor-dialog.tsx` - Multi-Step Sensor-Setup mit Hardware-Erkennung
- [ ] `components/sensors/edit-sensor-dialog.tsx` - Sensor bearbeiten mit flexibler Port-Zuordnung
- [ ] `components/sensors/sensor-diagnostics.tsx` - Universal Diagnose für alle Hardware-Typen
- [ ] `components/sensors/sensor-calibration.tsx` - Kalibrierung unabhängig von Anschluss-Art
- [ ] `components/sensors/bulk-actions-toolbar.tsx` - Bulk-Operationen
- [ ] `components/sensors/sensor-status-badge.tsx` - Status-Anzeigen mit Hardware-Info

### Settings Page (`app/dashboard/settings/page.tsx`)

- [ ] `components/settings/settings-navigation.tsx` - Settings-Kategorien
- [ ] `components/settings/user-profile-settings.tsx` - Benutzerprofil
- [ ] `components/settings/system-settings.tsx` - System-Konfiguration
- [ ] `components/settings/notification-settings.tsx` - Benachrichtigungen
- [ ] `components/settings/security-settings.tsx` - Sessions, API Keys
- [ ] `components/settings/backup-settings.tsx` - Backup & Restore
- [ ] `components/settings/integration-settings.tsx` - Webhooks, APIs
- [ ] `components/settings/maintenance-tools.tsx` - Logs, Diagnostik

## 📈 Chart-Komponenten

### Basis-Charts (`components/charts/`)

- [ ] `components/charts/line-chart.tsx` - Zeitreihen-Diagramme mit Recharts
- [ ] `components/charts/gauge-chart.tsx` - Kreisdiagramme für Einzelwerte
- [ ] `components/charts/bar-chart.tsx` - Balkendiagramme für Vergleiche
- [ ] `components/charts/area-chart.tsx` - Flächendiagramme für Trends
- [ ] `components/charts/heatmap-chart.tsx` - Heatmaps für Sensor-Verteilungen

## 🔧 Measurement Objects Erweiterungen

### Measurement Objects (`app/dashboard/measurement-objects/page.tsx`)

- [ ] `components/measurement-objects/measurement-objects-header.tsx` - Header mit Bulk-Aktionen
- [ ] `components/measurement-objects/analytics-cards.tsx` - Messstatistiken
- [ ] `components/measurement-objects/batch-operations.tsx` - Bulk Edit/Delete
- [ ] `components/measurement-objects/measurement-scheduler.tsx` - Geplante Messungen
- [ ] `components/measurement-objects/measurement-history.tsx` - Messungsverlauf

## 🔐 Authentifizierung (Single-User System)

### Login (`components/form/login-form.tsx`)

- [ ] `components/auth/session-management.tsx` - Sitzungsverwaltung und Auto-Logout
- [ ] `components/auth/password-reset.tsx` - Passwort-Reset für lokalen Benutzer
- [ ] `components/auth/security-settings.tsx` - Lokale Sicherheitseinstellungen

## 🎨 UI Primitive Komponenten

### Forms (`components/forms/`)

- [ ] `components/forms/date-range-picker.tsx` - Erweiterte Datumsauswahl
- [ ] `components/forms/multi-select.tsx` - Mehrfachauswahl mit Suche
- [ ] `components/forms/sensor-form.tsx` - Flexible Sensor-Konfiguration für verschiedene Hardware
- [ ] `components/forms/settings-form.tsx` - Settings-Formulare
- [ ] `components/forms/multi-file-upload.tsx` - Wiederverwendbare Multi-File-Upload Komponente
- [ ] `components/forms/file-type-filter.tsx` - File-Type Filter und Sortierung

### UI Primitives (`components/ui/`)

- [ ] `components/ui/color-picker.tsx` - Farb-Auswahl für Themes
- [ ] `components/ui/data-grid.tsx` - Erweiterte Tabelle mit Editing
- [ ] `components/ui/tree-view.tsx` - Hierarchische Datenstruktur
- [ ] `components/ui/timeline.tsx` - Ereignis-Timeline
- [ ] `components/ui/stats-card.tsx` - Wiederverwendbare Statistik-Karten
- [ ] `components/ui/status-indicator.tsx` - Status-Badges und -Icons
- [ ] `components/ui/breadcrumb-nav.tsx` - Navigation-Breadcrumbs
- [ ] `components/ui/empty-state.tsx` - Leere Zustände mit Aktionen
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

- [ ] `components/realtime/websocket-provider.tsx` - WebSocket-Integration
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

### API Services

- [ ] `services/test-object-api.ts` - API Service für Test-Object CRUD Operations
- [ ] `services/upload-api.ts` - API Service für File-Upload Operations
- [ ] `services/file-api.ts` - API Service für File Delete Operations

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

### Hoch (Core Features)

1. Dashboard Statistik-Karten
2. Global Search Komponente
3. Benachrichtigungen
4. Charts (Line, Gauge)
5. Sensor-Management Grundlagen

### Medium (Enhanced UX)

1. Real-time Updates
2. Export-Funktionalitäten
3. Mobile Optimierung
4. Settings-Interface

### Niedrig (Nice-to-Have)

2. Advanced Analytics
3. Accessibility Features
4. Batch-Operationen

Jede Komponente sollte:

- TypeScript-typisiert sein
- Responsive Design haben
- Accessibility-Standards erfüllen
- Internationalisierung unterstützen
- Loading/Error States behandeln
- Unit Tests besitzen
