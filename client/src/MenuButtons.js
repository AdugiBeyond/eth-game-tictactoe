import React from 'react';

export default class MenuButtons extends React.Component {
    render() {
        return (
            <div>
                <div style={{textAlign: 'center'}}>
                    <button className="btn btn-lg btn btn-info" onClick={this.props.onCreateGameClick}>
                        创建游戏
                    </button>
                    &nbsp;
                    <button className="btn btn-lg btn btn-info" onClick={this.props.onJoinGameClick}>
                        加入游戏
                    </button>
                    <p></p>
                    <button className="btn btn-lg btn-danger " onClick={this.props.onResetGameClick}>
                        &nbsp;重置游戏&nbsp;
                    </button>
                </div>
            </div>
        )
    }
}
