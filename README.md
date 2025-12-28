# Therma-Craft

Ein Sanierungssimulator für 1957er Grundrisse mit Fußbodenheizung.

## Übersicht

Therma-Craft ist ein Simulations-Spiel zur Planung und Optimierung von Fußbodenheizungen in Altbauten aus den 1950er Jahren. Das Ziel ist es, mit begrenztem Budget eine Heizungsanlage zu entwerfen, die trotz Einfachglas-Fenstern und schlechter Dämmung eine Raumtemperatur von 21°C mit maximal 35°C Vorlauftemperatur erreicht.

## Features

### Domain-Specific Languages (DSLs)

#### L-FLOOR DSL
Parser für Grundriss-Definitionen mit:
- Wand-Definitionen mit U-Werten (W/(m²·K))
- Fenster mit Fläche und Verglasung-Typ
- Hohlblock-Material (typisch für 1957)
- Raum-Definitionen mit Zieltemperatur

**Beispiel:**
```
WALL 1 U=1.4 LENGTH=5.0 MATERIAL=HOHLBLOCK
WINDOW 1 U=5.8 AREA=2.0 TYPE=EINFACHGLAS
ROOM 1 AREA=25.0 TARGET=21.0
```

#### P-PIPE DSL
Parser für Rohrleitungs-Layout mit:
- Rohr-Segmente mit Start/End-Koordinaten
- Biegeradien für Kurven
- Vektorgrafik-Darstellung

**Beispiel:**
```
PIPE 1 START=(0,0) END=(5,0) RADIUS=0.016
BEND 1 ANGLE=90 RADIUS=0.2 AT=(5,0)
PIPE 2 START=(5,0) END=(5,3) RADIUS=0.016
```

### Simulationen

#### Real-time Heatmap (FEM)
- Finite-Elemente-Methode zur Wärmeverteilung
- 12,5cm Raster-Auflösung
- Visualisierung der Temperaturverteilung
- Konvergenz zu stationärem Zustand

#### Hydraulik-Simulation
- Druckverlust-Berechnung nach Darcy-Weisbach
- Berücksichtigung von Rohrlänge und Biegeradien
- K-Faktor-Methode für Biegungen

### Benutzeroberfläche

- **12,5cm Grid-Canvas**: Präzises Zeichnen im Raster
- **Drag-and-Drop Pipe Tool**: Interaktives Verlegen von Rohren
- **Live-Kosten-Widget**: 
  - Sanierungsbudget: 15.000 €
  - Material- und Arbeitskosten
  - Echtzeit-Budget-Tracking

### Ziel

Erreichen Sie:
- ✅ Maximale Vorlauftemperatur: 35°C
- ✅ Raumtemperatur: 21°C (±0,5°C)
- ✅ Budget nicht überschritten

## Installation

1. Repository klonen:
```bash
git clone https://github.com/carbon-drive/Thermal-Craft.git
cd Thermal-Craft
```

2. Öffnen Sie `index.html` in einem modernen Browser (Chrome, Firefox, Edge)

Keine Build-Schritte oder Dependencies erforderlich - reine HTML5/JavaScript-Anwendung!

## Verwendung

1. **L-FLOOR DSL bearbeiten**: Definieren Sie Wände, Fenster und Räume
2. **Parse L-FLOOR**: Klicken Sie "Parse L-FLOOR" um die Eingabe zu validieren
3. **P-PIPE DSL bearbeiten**: Zeichnen Sie Rohrleitungen oder verwenden Sie das Drag-Tool
4. **Parse P-PIPE**: Klicken Sie "Parse P-PIPE" um die Rohre zu validieren
5. **Simulation starten**: Berechnen Sie Wärmeverteilung und Kosten
6. **Optimieren**: Passen Sie das Design an, um das Ziel zu erreichen

## Technische Details

### Berechnungen

- **U-Werte**:
  - Hohlblock-Wand: 1,4 W/(m²·K) (typisch 1957)
  - Einfachglas: 5,8 W/(m²·K)
  - Doppelglas: ~2,8 W/(m²·K)

- **Wärmeverlust**: Q = U × A × ΔT

- **Hydraulik**: 
  - Darcy-Weisbach: ΔP = f × (L/D) × (ρ × v²/2)
  - Friction factor f = 0,02 (glatte Rohre)

- **Kosten**:
  - Rohr DN16: ~60 €/m (Material + Installation)
  - Arbeit: 65 €/h
  - Doppelglas: 350 €/m²

## Architektur

```
├── index.html              # Haupt-UI
├── styles.css              # Styling
└── js/
    ├── main.js             # Hauptanwendung
    ├── lfloor-parser.js    # L-FLOOR DSL Parser
    ├── ppipe-parser.js     # P-PIPE DSL Parser
    ├── heat-simulation.js  # FEM Wärmesimulation
    ├── cost-calculator.js  # Budget-Kalkulation
    └── canvas-renderer.js  # Grid-Canvas Rendering
```

## Lizenz

MIT License - siehe LICENSE Datei

## Entwicklung

Rein clientseitige Anwendung mit:
- Vanilla JavaScript (ES6 Modules)
- HTML5 Canvas API
- CSS3 Flexbox/Grid

Keine externen Dependencies oder Framework erforderlich!
