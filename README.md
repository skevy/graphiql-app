GraphiQL.app
------------

[![Build Status](https://travis-ci.org/skevy/graphiql-app.svg?branch=master)](https://travis-ci.org/skevy/graphiql-app)

A light, Electron-based wrapper around GraphiQL.

Provides a tabbed interface for editing and testing GraphQL queries/mutations with GraphiQL.

#### macOS installation

If you have [Homebrew](http://brew.sh/) installed on macOS:

```
brew cask install graphiql
```

Alternately, download the binary from the [Releases](https://github.com/skevy/graphiql-app/releases) tab.

#### Linux installation

The graphiql-app uses the [AppImage](https://appimage.org/) format for its Linux version. You download it from the  [Electron app directory](https://electronjs.org/apps/graphiql) (click the "Download for Linux"-button) or from the [Releases](https://github.com/skevy/graphiql-app/releases) tab.

Either way, you will get a `.AppImage` binary. Put it in a safe place and make it executable:

```
chmod +x graphiql-app-0.7.2-x86_64.AppImage
```

Then simply execute the app. It will ask whether to add shortcuts to your desktop and menus for easy access in the future.

#### Getting started developing

- Branch and/or clone the repo locally.
- cd into it
- install all the require packages: `npm i`
- build the project: `npm run build`
- start the project: `npm start`
