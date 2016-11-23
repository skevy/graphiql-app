export default () => {

	let factories = {}
	let cache = {}

    function register(options) {
		factories[options.name] = Object.assign({}, {
            dependencies: [],
            asMap: false
        }, options)
    }

    function get(name) {

        let instance = cache[name]

        if (!instance && factories[name]) {

            const {factory, dependencies, asMap} = factories[name]

            let resolvedDeps = dependencies.reduce((result, depName) => {

                const factoryObj = factories[depName]

                if (!factoryObj) {
                    throw `Could not resolve ${depName} on ${name}`
                }

                if (factoryObj.dependencies.indexOf(name) !== -1) {
                    throw `No circular dependencies allowed: '${name}' -> '${depName}' -> '${name}'`
                }

                result[depName] = get(depName)

                return result

            }, {})

            if (!factory) {
                throw `No factory defined for ${name}`
            }

            resolvedDeps = asMap ? [resolvedDeps] : Object.keys(resolvedDeps).map(key => resolvedDeps[key])

            instance = factory.apply(factory, resolvedDeps)
            cache[name] = instance
        }

        return instance
    }

    return {
    	register,
    	get
    }
}