// main.js - Proceso principal de Electron
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // Crear la ventana del navegador
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        icon: path.join(__dirname, 'Scala_logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false // Permitir CORS para Supabase
        },
        backgroundColor: '#f0f0f0',
        show: false // No mostrar hasta que esté lista
    });

    // Cargar login.html como inicio
    mainWindow.loadFile('login.html');

    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    // Abrir DevTools en modo desarrollo (comentar en producción)
    // mainWindow.webContents.openDevTools();

    // Manejar cierre de ventana
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Crear menú personalizado
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Inicio',
                    click: () => {
                        mainWindow.loadFile('index.html');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Salir',
                    accelerator: 'Alt+F4',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Módulos',
            submenu: [
                {
                    label: 'Archivos',
                    click: () => {
                        mainWindow.loadFile('archivos.html');
                    }
                },
                {
                    label: 'Caja',
                    click: () => {
                        mainWindow.loadFile('caja.html');
                    }
                },
                {
                    label: 'Reportes',
                    click: () => {
                        mainWindow.loadFile('reportes.html');
                    }
                },
                {
                    label: 'Exámenes',
                    click: () => {
                        mainWindow.loadFile('examenes-menu.html');
                    }
                },
                {
                    label: 'Mantenimiento',
                    click: () => {
                        mainWindow.loadFile('mantenimiento.html');
                    }
                },
                {
                    label: 'Seguridad',
                    click: () => {
                        mainWindow.loadFile('seguridad.html');
                    }
                }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                {
                    label: 'Recargar',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: 'Pantalla Completa',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                { type: 'separator' },
                {
                    label: 'Herramientas de Desarrollo',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Acerca de SCALA',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Acerca de SCALA',
                            message: 'SCALA - Sistema de Gestión para Academia de Música',
                            detail: 'Versión 1.0.0\n\nSistema de gestión integral para academias de música.\n\n© 2026 SCALA',
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Cuando Electron haya terminado de inicializarse
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// En macOS, recrear la ventana cuando se hace clic en el icono del dock
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

