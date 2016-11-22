import merge from "lodash/merge"
import clone from "lodash/clone"
import moment from "moment"

export default (db) => {

    return {
        createQuery: ({projectId, input}) => {

            input = Object.assign({}, input, {
                updatedAt: moment().utc().toISOString(),
                createdAt: moment().utc().toISOString(),
                projectId
            })

            return new Promise((resolve, reject) => {

                db.queries.insert(input, (err, result) => {

                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(result)
                })
            })
        },
        updateQuery: ({projectId, queryId, input}) => {

            input = Object.assign({}, input, {
                projectId,
                updatedAt: moment().utc().toISOString()
            })

            return new Promise((resolve, reject) => {

                db.queries.update({_id: queryId}, input, (err, result) => {

                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(result)
                })
            })
        },
        updateProject: ({projectId, input}) => {

            input = Object.assign({}, input, {
                updatedAt: moment().utc().toISOString()
            })

            return new Promise((resolve, reject) => {

                db.projects.update({_id: projectId}, input, (err, result) => {

                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(result)
                })
            })
        },
        setProjectSetting: ({projectId, key, value}) => {

            return new Promise((resolve, reject) => {

                const opts = {
                    $set: {
                        settings: {}
                    }
                }

                opts.$set.settings[key] = value

                db.projects.update({_id: projectId}, opts, (err, result) => {

                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(result)
                })
            })
        },
        removeProject: ({projectId}) => {

            return new Promise((resolve, reject) => {

                db.projects.remove({_id: projectId}, {}, (err, result) => {

                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(result)
                })
            })
        },
        createProject: ({input}) => {

            input = merge({}, {
                updatedAt: moment().utc().toISOString(),
                createdAt: moment().utc().toISOString(),
                variables: {},
                settings: {
                    queryListState: 'HISTORY'
                }
            }, input)

            return new Promise((resolve, reject) => {

                db.projects.insert(input, (err, result) => {

                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(result)
                })
            })
        },
        removeQuery: ({queryId}) => {

            return new Promise((resolve, reject) => {

                db.queries.remove({_id: queryId}, {}, (err, result) => {

                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(result)
                })
            })
        }
    }
}