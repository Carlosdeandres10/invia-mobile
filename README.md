# Invia Pipeline — Mobile App 📱

App nativa Android/iOS para el panel de control de Invia Pipeline.

## Stack

- **React Native** 0.76+ (New Architecture)
- **Expo** — Build & toolchain
- **TypeScript** strict
- **React Navigation** — Tab bar + stack nativo
- **Zustand** — Estado global
- **Axios** — HTTP client

## Requisitos

- Node.js 18+
- Expo CLI: `npm install -g expo-cli` (opcional, incluido via npx)
- Android Studio + SDK (para builds locales)
- Servidor Flask (`invia-pipeline`) corriendo y accesible por red

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Desarrollo con Expo Go
npx expo start

# Build Android local (requiere Android SDK)
npx expo run:android

# Build en la nube
npx -y eas-cli build --platform android --profile preview
```

## Configuración

La app pide la URL del servidor Flask al iniciar sesión.  
Ejemplo: `http://192.168.1.100:5050`

El servidor debe estar corriendo `panel_server.py` y ser accesible desde el dispositivo móvil (misma red WiFi).

## Estructura

```
src/
├── api/          → Cliente HTTP tipado para todos los endpoints
├── theme/        → Paleta de colores Invia + dark/light mode
├── store/        → Estado global (auth, chat, settings)
├── components/   → Componentes reutilizables (KPICard, Badge, etc.)
├── screens/      → 6 pantallas (Login, Dashboard, Chat, Retail, Data, Config)
└── navigation/   → Tab bar + auth stack
```

## Pantallas

| Pantalla      | Función                                 |
| ------------- | --------------------------------------- |
| Login         | Auth + config URL servidor              |
| Dashboard     | KPIs + estado APIs                      |
| Chat IA       | Streaming SSE con IA (modos PRO/Rápido) |
| Retail        | Búsqueda multi-plataforma               |
| Data Explorer | Editor SQL directo                      |
| Configuración | Tema, URL servidor, logout              |
