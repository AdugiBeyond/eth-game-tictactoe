import React from 'react';

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000"
export default class Square extends React.Component {

    constructor(props) {
        super(props)
        // es6 语法
        // 本页面要设置状态，用户点击，提前显示该位置内容，避免等待，如不需要否则可直接使用props或者无状态组件
        // 保存所有属性到状态变量
        this.state = {...props}

        // 等价
        // let {key,stone,board,account,nextPlayer,onClick}=props
        // this.state = {key,stone,board,account,nextPlayer,onClick}
        console.log(this.state)
    }


    componentWillReceiveProps(nextProps) {
        this.state = {...nextProps}
    }

    // 状态变量未Object,可以不写默认值，
    state = {}

    onItemClick(event) {
        let errMsg = this.mustCheck()
        if (errMsg != "") {
            event.target.className += " animated shake";
            alert(errMsg)
            return
        }

        this.state.onClick(this.state.stone);
        // 设置 修改
        event.target.className += " animated rubberBand square-container-active";
    }

    // 下棋校验，返回错误信息，没有返回空
    mustCheck() {
        let {account, nextPlayer} = this.state
        console.log(this.state)
        if (this.state.account == null) {
            return "用户未登录"
        }

        if (nextPlayer == '') {
            return "游戏未开始"
        }

        if (account.toLowerCase() != nextPlayer.toLowerCase()) {
            return "等待对方下子"
        }
        if (this.getHtmlValue() != '') {
            return "这里不能下子"
        }
        return ""
    }

    // 获取该位置的文本显示
    getHtmlValue() {
        let {stone, board, account,nextPlayer} = this.state
        // 获取该位置的地址值
        let x = stone[0]
        let y = stone[1]
        let stoneValue = board[x][y]

        // 未登录显示空
        if (account == null||nextPlayer==""||stoneValue==EMPTY_ADDRESS||stoneValue==""){
            return ""
        }
        console.log(x,y,stoneValue==EMPTY_ADDRESS,stoneValue)
        // 自己显示X，否则显示O
        return stoneValue.toString().toLowerCase() == account.toString().toLowerCase() ? 'X' : 'O'
    }

    render() {
        let stoneHtmlValue = this.getHtmlValue()
        return (
            <div onClick={this.onItemClick.bind(this)} className="col-xs-4 square-container">
                {stoneHtmlValue}
            </div>
        )
    }
}
