import React from "react"

export default () => {

    return class Layout extends React.Component {

        state = {
            width: 0,
            height: 0
        }

        componentDidMount() {
            window.addEventListener('resize', this.handleWindowResize)
            this.handleWindowResize()
        }

        render() {
            return this.props.children({
                width: this.state.width,
                height: this.state.height
            })
        }

        handleWindowResize = () => {
            this.setState({
                width: window.innerWidth,
                height: window.innerHeight
            })
        }
    }
}