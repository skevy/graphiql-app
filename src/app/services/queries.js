export default (db) => {

    function allProjects() {

        return new Promise((resolve, reject) => {

            db.projects.find({}).sort({updatedAt: -1}).exec((err, results) => {

                if (err) {
                    reject(err)
                    return
                }

                resolve(results)
            })
        })
    }

    function findProject({projectId}) {

        return new Promise((resolve, reject) => {

            db.projects.findOne({_id: projectId}, {}, (err, result) => {

                if (err) {
                    reject(err)
                    return
                }

                resolve(result)
            })
        })
    }

    function findProjectQueries({projectId, type}) {

        return new Promise((resolve, reject) => {

            db.queries.find({projectId: projectId, type: type}).sort({createdAt: -1}).exec((err, results) => {

                if (err) {
                    reject(err)
                    return
                }

                resolve(results)
            })
        })
    }

    function findQuery({queryId}) {

        return new Promise((resolve, reject) => {

            db.queries.findOne({_id: queryId}, {}, (err, result) => {

                if (err) {
                    reject(err)
                    return
                }

                resolve(result)
            })
        })
    }

    return {
        allProjects,
        findProject,
        findProjectQueries,
        findQuery
    }
}