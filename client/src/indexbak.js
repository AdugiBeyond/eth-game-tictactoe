import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './animate.css'
import Square from './Square'
import MenuButtons from './MenuButtons'
import getWeb3 from "./utils/getWeb3"
import contract from 'truffle-contract'
import _TicTacToe from './contracts/TicTacToe.json'


// 棋盘值
const STONES = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000"
const GAME_COST = "1"; //1 eth
let web3 = null

class Board extends React.Component {

    state = {
        accounts: null, // 账户

        // 棋盘相关
        instance: null, // 游戏实例
        board: [['', '', ''], ['', '', ''], ['', '', '']],
        player1: '', // 玩家一，等于创建者
        player2: '', // 玩家二，
        nextPlayer: '',// 该谁下棋

        winner: '',
        gameResult: '', // 游戏结果，
    }

    // 获取合约
    getTicTacToe = () => {
        let TicTacToe = contract(_TicTacToe)
        TicTacToe.setProvider(web3.currentProvider);
        return TicTacToe
    }

    componentDidMount = async () => {
        try {
            web3 = await getWeb3();
            console.log("currentProvider", web3.currentProvider)
            const accounts = await web3.eth.getAccounts();
            console.log("accounts", accounts)
            this.setState({accounts});
        } catch (error) {
            alert(`web3 加载失败`,);
            console.error(error);
        }
    }

    componentWillUnmount() {
        this.unRegistNextPlayerEvent()
    }

    // 点击创建游戏
    onCreateGameClick = () => {
        console.log("创建游戏")
    }

    // 加入游戏
    onJoinGameClick = async () => {
        console.log("加入游戏")
    }

    // 更新游戏面板
    updateBoard = () => {
        console.log("更新面板")
    }

    // 设置棋盘
    onStoneClick = (stone) => {
        console.log("设置棋盘",stone)
    }

    // 重置游戏
    onResetGameClick = () => {
        window.location.reload()
    }

    // 设置赢家
    setWinner = (winner) => {
        let gameResult = ""
        if (winner === this.state.player1) {
            gameResult = "恭喜胜利，再来一局"
        } else if (winner === this.state.player2) {
            gameResult = "失败，再接再厉"
        } else {
            gameResult = "旗鼓相当，平局，再来一局"
        }
        this.setState({gameResult})
    }

    // 00 01 02
    // 10 11 12
    // 20 21 22
    render() {
        let {accounts, board, player1, player2, nextPlayer, instance, winner} = this.state
        let gameAddress = instance == null ? "" : instance.address
        console.log("state", this.state)
        console.log("", instance)
        if (winner != ''){
            winner = winner == EMPTY_ADDRESS ? "平局，退回赌金" : "赢家为："+winner
        }
        let squares = STONES.map((stone, i) => {
            return (<Square
                key={i}
                stone={stone}
                board={board}
                account={accounts == null ? null : accounts[0]}
                nextPlayer={nextPlayer}
                onClick={this.onStoneClick}/>)
        })

        return (
            <div style={{textAlign: 'center'}}>
                {/*标题*/}
                <h2 style={{fontSize: '42px', color: "red"}}
                    className="animated flipInY">性感荷官 在线发牌
                </h2>
                {/* 游戏信息展示*/}
                <div>
                    <h5>当前用户:{accounts == null ? "未检测到" : accounts[0]}</h5>
                    <h5>游戏地址:{gameAddress == "" ? "等待创建" : gameAddress}</h5>
                    <h5>player1:{player1 == "" ? "等待加入" : player1}</h5>
                    <h5>player2:{player2 == "" ? "等待加入" : player2}</h5>
                    <h5>nextPlayer:{player2 == "" ? "游戏未开始" :
                        <span style={{color: "red"}}>{nextPlayer}</span>}</h5>
                    <h3 id="gameResult">
                        <span style={{fontSize: '32px', color: "red"}}>
                            <b>{winner}</b></span>
                    </h3>
                </div>
                {/*棋盘*/}
                <div className="container animated fadeInUp">
                    <div className="row">
                        <div className="col-xs-12">{squares}</div>
                    </div>
                </div>
                <br/>

                <MenuButtons
                    onCreateGameClick={this.onCreateGameClick}
                    onJoinGameClick={this.onJoinGameClick}
                    onResetGameClick={this.onResetGameClick}/>
            </div>
        )
    }
}

ReactDOM.render(
    <Board/>,
    document.getElementById('root')
);
