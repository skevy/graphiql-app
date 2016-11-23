import isUndefined from "lodash/isUndefined"
import reduce from "lodash/reduce"

export default function getDefined(input, whitelist) {

    return reduce(whitelist, (result, key) => {

        if (isUndefined(input[key])) {
            return result
        }

        result[key] = input[key]

        return result
    }, {})
}