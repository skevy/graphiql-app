import Datastore from "nedb"
import electron from "electron"

export default () => {

    const dataPath = electron.remote.app.getPath('userData')

    return {
        projects: new Datastore({ filename: dataPath + '/projects', autoload: true }),
        queries: new Datastore({ filename: dataPath + '/queries', autoload: true })
    }
}