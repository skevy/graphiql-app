import React from 'react'

export default () => {

	return class LayoutView extends React.Component {

		render() {
			return (
				<div className="LayoutView">
					{this.props.children}
				</div>
			)
		}
	}
}