import React from "react"

export default (HeaderItem) => {

    return class HeaderEditor extends React.Component {

        render() {

            return (
                <div
                    className="HeaderEditor"
                    style={{
                        top: this.props.top,
                        width: this.props.width,
                        height: this.props.height
                    }}
                >
                    {this.props.headers.size ? (
                        <div className="HeaderEditorBody">
                            {this.props.headers.map((header, index) => (
                                <HeaderItem
                                    key={index}
                                    header={header}
                                    onChange={this.handleChange}
                                    onRemove={this.handleRemove}
                                />
                            )).toArray()}
                        </div>
                    ) : (
                        <div className="HeaderEditorBody">
                            <div className="NoHeaders">
                                <div className="NoHeaders__Message">
                                    No headers (yet)
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="HeaderEditorFooter">
                        <div className="Menu--horizontal Menu--right">
                            <div className="MenuItem">
                                <button
                                    type="button"
                                    className="button"
                                    onClick={this.handleClearClick}
                                >
                                    Clear headers
                                </button>
                            </div>
                            <div className="MenuItem">
                                <button
                                    type="button"
                                    className="button"
                                    onClick={this.handleAddClick}
                                >
                                    Add header
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        handleAddClick = e => {

            this.props.onHeaderAddClick({
                e
            })
        }

        handleChange = ({id, header}) => {

            this.props.onHeaderChange({
                id,
                header
            })
        }

        handleRemove = ({id}) => {

            this.props.onHeaderRemove({
                id
            })
        }

        handleClearClick = e => {

            this.props.onHeaderClearClick({
                e
            })
        }
    }
}