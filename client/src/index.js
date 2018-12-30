import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './animate.css'
import Square from './Square'
import MenuButtons from './MenuButtons'
import contract from 'truffle-contract'

import TicTacToeContract from './contracts/TicTacToe.json'
import getWeb3 from "./utils/getWeb3"

// let TicTacToe = contract(_TicTacToe)

const STONES = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]];


class Board extends React.Component {

    state = {
        // web3 相关
        web3: null,
        accounts: null,

        // 棋盘相关
        instance: null,
        board: [['', '', ''], ['', '', ''], ['', '', '']],
        player1: null,
        player2: null,
        nextPlayer: '',// 该谁下棋

        winner: null,
        gameResult: '',
        event: {},
    }

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            console.log("currentProvider",web3.currentProvider)
            const accounts = await web3.eth.getAccounts();
            this.setState({web3, accounts});
        } catch (error) {
            alert(`web3 加载失败`,);
            console.error(error);
        }
    };

    onCreateGameClick = async () => {
        const {accounts} = this.state;
        const networkId = await getWeb3().eth.net.getId();
        const deployedNetwork = TicTacToeContract.networks[networkId];
        const instance = new getWeb3().eth.Contract(
            TicTacToeContract.abi,
            deployedNetwork && deployedNetwork.address,
        );

        // TicTacToe.new({from: accounts[0], value: web3.utils.toWei("1", 'ether'), gas: 300000})
        //     .then(instance => {
        //         this.setState({instance})
        //     }).catch(error => {
        //     console.log("new", error)
        // })
    }


    onJoinGameClick = () => {
        let gameAddress = prompt("请输入游戏地址")
        if (gameAddress === "") {
            return
        }
        let {accounts, web3} = this.state;

        TicTacToeContract.at(gameAddress)
            .then(instance => {
                this.setState({instance})
                return instance.methods.joinGame.send({
                    from: accounts[0],
                    value: web3.utils.toWei(1, 'ether'),
                    gas: 300000
                })
            })
            .then(result => {
                console.log(result)
                this.setState({player2: accounts[0]})
            })
            .catch(error => {
                console.error("join", error)
            })

    }

    getBoard = () => {
        let {instance, accounts} = this.state
        instance.methods.getBoard.call({from: accounts[0]})
            .then(board => {
                // 更新游戏棋盘
                this.setState({board})
                console.log("getBoard", board)
            })
            .catch(error => {
                console.error("getBoard", error)
            })
    }

    handleOnClick(index, turn) {

        const newSquares = this.state.squares.slice();
        newSquares[index] = turn;

        var winner = this.calculateWinner(newSquares);

        this.setState({
            xIsNext: !this.state.xIsNext,
            squares: newSquares,
            winner: winner !== null ? winner : this.state.winner
        });

        if (winner !== null) {
            document.getElementById('gameResult').className = "animated rotateIn";
        }
    }

    onStoneClick = (stone) => {

        console.log("onStoneClick", stone)
        let {instance, accounts} = this.state
        instance.methods.setStone(stone[0], stone[1]).send({from: accounts[0]})
            .then(result => {
                console.log("setStone", result)
            })
            .catch(error => {
                console.error("setStone", error)
            })
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

    registEvent = () => {
        let {instance} = this.state
        // 玩家加入游戏
        instance.PlayerJoined().watch((error, event) => {
            if (error != null) {
                console.log(event)
            } else {
                console.error("event", error)
            }
        })

        // 下一个玩家
        instance.NextPlayer().watch((error, event) => {
            if (error != null) {
                console.log(event)
                // 停止 listen joinevent
            } else {
                console.error("event", error)
            }
        })

        // 游戏结束
        instance.GameOverWithWin().watch((error, event) => {
            if (error != null) {
                console.log(event)
                this.setState({board: null})

                // stop listen next player event and self
            } else {
                console.error("event", error)
            }
        })

        // 提现成功
        instance.GameOverWithDraw().watch((error, event) => {
            if (error != null) {
                console.log(event)
                // stop listen self
            } else {
                console.error("event", error)
            }
        })
    }

    // 重置游戏
    onResetGameClick = () => {
        window.location.reload()
    }

    // 00 01 02
    // 10 11 12
    // 20 21 22
    render() {
        let {accounts, board, nextPlayer} = this.state
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
            <div>
                <h1 style={{
                    textAlign: 'center',
                    fontSize: '46px',
                    color: 'rgba(52, 152, 219,1.0)'
                }}
                    className="animated flipInY">性感荷官 在线发牌
                </h1>
                <h3 style={{textAlign: 'center'}} id="gameResult">
                    <span>{this.state.gameResult} <b>{this.state.winner}</b></span>
                </h3>
                <div className="container animated fadeInUp">
                    <div className="row">
                        <br/>
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
