import uuid from "uuid"
import {Map, List} from "immutable"

export default (delegate) => {

    return {
        getHeaders: () => {
            return delegate.state.query.get('headers')
        },
        handleAddClick: ({e}) => {

            delegate.setState({
                query: delegate.state.query.update('headers', headers => {

                    return headers.push(Map({
                        id: uuid.v4(),
                        key: '',
                        value: ''
                    }))
                })
            })
        },

        handleChange: ({id, header}) => {

            delegate.setState({
                query: delegate.state.query.update('headers', headers => {

                    return headers.map(existingHeader => {

                        if (existingHeader.get('id') === id) {
                            return header
                        }

                        return existingHeader
                    })
                })
            })
        },

        handleRemove: ({id}) => {

            delegate.setState({
                query: delegate.state.query.update('headers', headers => {

                    return headers.filter(header => {
                        return header.get('id') !== id
                    })
                })
            })
        },

        handleClear: ({e}) => {

            delegate.setState({
                query: delegate.state.query.set('headers', List())
            })
        }
    }
}