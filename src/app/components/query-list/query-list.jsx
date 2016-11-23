import React from "react"
import ReactList from "react-list"
import moment from "moment"

export default (QueryListItem) => {

    return class QueryList extends React.Component {

        state = {
            query: ''
        }

        componentWillMount() {

            this.filterData({
                query: this.state.query,
                props: this.props
            })
        }

        componentWillUpdate(nextProps) {

            if (this.props.data !== nextProps.data) {
                this.filterData({
                    query: this.state.query,
                    props: nextProps
                })
            }
        }

        filterData({props, query}) {

            let data = props.data.map(item => Object.assign({}, item, {
                shortname: (item.operationType || "").substring(0, 2),
                title: item.title || "<Unnamed>",
                meta: moment(item.createdAt).from(moment()),
                subMeta: item.duration ? `${item.duration}ms` : null
            }))

            const filterFn = item => {
                return item.title.toLowerCase().indexOf(query.toLowerCase()) !== -1
            }

            data = data.filter(item => filterFn(item))

            this.setState({
                data
            })
        }

        render() {

            return (
                <div className="QueryList">
                    <div className="QueryListFilter">
                        <div className="Filter">
                            <input className="FilterInput" placeholder="Filter" value={this.state.query}
                                   onChange={this.handleQueryChange}/>
                        </div>
                    </div>
                    <div className="QueryListContent">
                        <ReactList
                            type="uniform"
                            length={this.state.data.length}
                            itemRenderer={this.handleItemRender}
                        />
                    </div>
                </div>
            )
        }

        handleQueryChange = e => {

            this.setState({
                query: e.target.value
            }, () => this.filterData({
                props: this.props,
                query: this.state.query
            }))
        }

        handleItemRender = (index, key) => {

            const item = this.state.data[index]

            return (
                <QueryListItem
                    key={key}
                    id={item._id}
                    active={this.props.activeId === item._id}
                    shortname={item.shortname}
                    title={item.title}
                    meta={item.meta}
                    subTitle={item.subTitle}
                    subMeta={item.subMeta}
                    onClick={this.handleClick}
                    onRemove={this.handleRemove}
                />
            )
        }

        handleClick = ({e, id}) => {

            this.props.onItemClick({
                e,
                id
            })
        }

        handleRemove = ({e, id}) => {

            this.props.onItemRemove({
                e,
                id
            })
        }
    }
}