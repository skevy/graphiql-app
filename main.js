const electron = require('electron')
// Module to control application life.
const app = electron.app
const Menu = electron.Menu
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

electron.crashReporter.start({
    productName: 'GraphiQL',
    companyName: 'Redound',
    submitURL: 'https://github.com/redound/graphiql-app/issues',
    autoSubmit: true
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {

    let template, menu

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        titleBarStyle: 'hidden-inset'
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    if (process.env.NODE_ENV === 'development') {
        mainWindow.openDevTools()
    }

    if (process.platform === 'darwin') {
        template = [{
            label: 'GraphiQL',
            submenu: [{
                label: 'About GraphiQL',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Services',
                submenu: []
            }, {
                type: 'separator'
            }, {
                label: 'Hide GraphiQL',
                accelerator: 'Command+H',
                selector: 'hide:'
            }, {
                label: 'Hide Others',
                accelerator: 'Command+Shift+H',
                selector: 'hideOtherApplications:'
            }, {
                label: 'Show All',
                selector: 'unhideAllApplications:'
            }, {
                type: 'separator'
            }, {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: function () {
                    app.quit()
                }
            }]
        }, {
            label: 'Edit',
            submenu: [{
                label: 'Cut',
                accelerator: 'Command+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'Command+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'Command+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'Command+A',
                selector: 'selectAll:'
            }]
        }, {
            label: 'View',
            submenu: [{
                label: 'Reload',
                accelerator: 'Command+R',
                click: function () {
                    mainWindow.reload()
                }
            }, {
                label: 'Toggle Full Screen',
                accelerator: 'Ctrl+Command+F',
                click: function () {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen())
                }
            }, {
                label: 'Toggle Developer Tools',
                accelerator: 'Alt+Command+I',
                click: function () {
                    mainWindow.toggleDevTools()
                }
            }, {
                role: 'resetzoom'
            }, {
                role: 'zoomin'
            }, {
                role: 'zoomout'
            }]
        }, {
            label: 'Window',
            submenu: [{
                label: 'Minimize',
                accelerator: 'Command+M',
                selector: 'performMiniaturize:'
            }, {
                type: 'separator'
            }, {
                label: 'Bring All to Front',
                selector: 'arrangeInFront:'
            }]
        }]

        menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    } else {
        template = [{
            label: '&View',
            submenu: [{
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: function () {
                    mainWindow.restart()
                }
            }, {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: function () {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen())
                }
            }, {
                label: 'Toggle &Developer Tools',
                accelerator: 'Alt+Ctrl+I',
                click: function () {
                    mainWindow.toggleDevTools()
                }
            }]
        }]
        menu = Menu.buildFromTemplate(template)
        mainWindow.setMenu(menu)
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})