import createDi from "app/di"
import bootstrap from "app/bootstrap"

const di = createDi()

console.log(di)

bootstrap(di)

const app = di.get('app')

app.run()