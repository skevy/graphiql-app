import React from "react"

export default (Component) => {

    return class Modal extends React.Component {

        state = {
            open: false,
            additionalProps: null
        }

        render() {

            return (
                <div>
                    {this.state.open ? (
                        <Component
                            {...this.props}
                            {...this.state.additionalProps}
                            close={this.close}
                            dismiss={this.close}
                        />
                    ) : null}
                </div>
            )
        }

        open(additionalProps) {

            return new Promise((resolve, reject) => {
                this.reject = reject
                this.resolve = resolve

                this.setState({
                    open: true,
                    additionalProps
                })
            })
        }

        close = (status, payload) => {

            this.setState({
                open: false,
                additionalProps: null
            }, () => {

                if (this.resolve) {
                    this.resolve({
                        status: status || 'CLOSED',
                        payload
                    })
                }
            })
        }

        dismiss = (err) => {

            this.setState({
                open: false,
                additionalProps: null
            }, () => {

                if (this.reject) {
                    this.reject(err)
                }
            })
        }
    }
}