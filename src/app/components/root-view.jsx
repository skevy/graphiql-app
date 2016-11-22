import React from 'react'

export default (RouterView) => {

	return class RootView extends React.Component {

		render() {
			return (
				<div className="RootView">
					<RouterView />
				</div>
			)
		}
	}
}