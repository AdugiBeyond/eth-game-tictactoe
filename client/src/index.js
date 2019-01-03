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

    onCreateGameClick = () => {

        const {accounts} = this.state
        let TicTacToe = this.getTicTacToe()
        TicTacToe.new({from: accounts[0], value: web3.utils.toWei(GAME_COST, "ether")})
            .then(instance => {
                console.log("instance", instance)
                this.setState({instance, player1: accounts[0]})
                this.registEvent()
                alert("游戏创建成功，邀请好友\n" + instance.address)
            })
            .catch(error => {
                console.log("new TicTacToe", error)
            })
    }

    // 加入游戏
    onJoinGameClick = async () => {
        let gameAddress = prompt("请输入游戏地址")
        if (gameAddress === "") {
            return
        }
        let {accounts} = this.state;
        let TicTacToe = this.getTicTacToe()
        try {
            let instance = await TicTacToe.at(gameAddress)
            console.log("at", instance == null, instance)

            this.setState({instance})
            this.registEvent()
            alert("游戏加载成功，加入赌金立即开始游戏")
            let result = await instance.joinGame({
                from: accounts[0],
                value: web3.utils.toWei(GAME_COST, 'ether')
            })
        } catch (e) {
            console.log("join error", e)
            this.setState({instance: null})
        }
    }

    // 更新游戏面板
    updateBoard = () => {
        let {instance, accounts} = this.state
        instance.getBoard.call({from: accounts[0]})
            .then(board => {
                this.setState({board})
                console.log("updateBoard", board)
            })
            .catch(error => {
                console.error("updateBoard", error)
            })
    }

    onStoneClick = (stone) => {
        console.log("onStoneClick", stone)
        let {instance, accounts} = this.state
        instance.setPosition(stone[0], stone[1], {from: accounts[0]})
            .then(result => {
                console.log("setStone", result)
                // this.handleLog(result.logs)
            })
            .catch(error => {
                console.error("setStone", error)
            })
    }

    // 重置游戏
    onResetGameClick = () => {
        window.location.reload()
    }

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

    // 注册事件，监听所有（也可以单独监听）
    registEvent = () => {
        let {instance, accounts} = this.state
        instance.allEvents( (err,data)=> {
            console.log(err,data)
            let {event, args} = data
            if (event == "GameStart") {
                alert("游戏即将开始\n" + "玩家1: " + args.player1 + "\n玩家2: " + args.player2)
                this.setState({...args})
            } else if (event == "NextPlayer") {
                alert("下一个玩家\n" + args.nextPlayer)
                this.updateBoard()
                this.setState({...args})
            } else if (event == "GameOver") {
                this.setState({...args})
                alert("GameOver")
            } else if (event == "Withdraw") {
                alert("游戏结束\n已向" + args.to + "转入赌金" + args.balance)
            }
        })
    }

    // 下一个玩家，更新页面
    registNextPlayerEvent = () => {
        let {instance} = this.state
        let nextPlayerEvent = instance.NextPlayer()
        //  下一个是一个状态 需保存到state
        this.setState(nextPlayerEvent)
        event.watch((error, event) => {
            console.log("event---NextPlayer")
            if (error == null) {
                console.log("NextPlayer", event)
            } else {
                console.error("event", error)
            }
        })
    }

    // 取消下一个玩家监听
    unRegistNextPlayerEvent = () => {
        let {nextPlayerEvent} = this.state
        if (nextPlayerEvent != null) {
            nextPlayerEvent.stopWatching()
        }
    }

    // 游戏结束事件，只需监听一次
    registGameOverEvent = () => {
        let {instance} = this.state
        let event = instance.GameOver()
        event.watch((error, event) => {
            console.log("GameOverEvent", event)
            if (error == null) {
                event.stopWatching()
                this.unRegistNextPlayerEvent()
            } else {
                console.error("event", error)
            }
        })
    }

    // 游戏结束提现事件 ，只需一次监听
    registWithdrawEvent = () => {
        let {instance} = this.state
        let event = instance.WithdrawEvent()
        event.watch((error, event) => {
            console.log("WithdrawEvent")
            if (error == null) {
                alert("有钱到账了")
                event.stopWatching()
                console.log("WithDrawEvent", event)
            } else {
                console.error("event", error)
            }
        })
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
